import os
import time
import json
import logging
import requests
from web3 import Web3
from dotenv import load_dotenv
from pycoingecko import CoinGeckoAPI
import openai

# Setup Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load Environment Variables
load_dotenv()

# Configuration
RPC_URL = os.getenv("MONAD_RPC_URL", "https://testnet-rpc.monad.xyz/")
PRIVATE_KEY = os.getenv("PRIVATE_KEY")
ORACLE_ADDRESS = os.getenv("CRE_ORACLE_ADDRESS")
MARKET_ADDRESS = os.getenv("PREDICTION_MARKET_ADDRESS")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

if not PRIVATE_KEY or not ORACLE_ADDRESS:
    logger.error("Missing environment variables. Please check .env")
    exit(1)

# Initialize Web3
w3 = Web3(Web3.HTTPProvider(RPC_URL))
account = w3.eth.account.from_key(PRIVATE_KEY)
logger.info(f"Oracle Node Started. Address: {account.address}")

# Load Contract ABIs
with open("oracle/CRESettlementOracle.json") as f:
    oracle_abi = json.load(f)["abi"]

with open("oracle/PredictionMarket.json") as f:
    market_abi = json.load(f)["abi"]

# Contract Instances
oracle_contract = w3.eth.contract(address=ORACLE_ADDRESS, abi=oracle_abi)
market_contract = w3.eth.contract(address=MARKET_ADDRESS, abi=market_abi)

# Initialize APIs
cg = CoinGeckoAPI()
if OPENAI_API_KEY:
    openai.api_key = OPENAI_API_KEY

def get_crypto_price(symbol):
    """Fetch current price from CoinGecko."""
    try:
        # Map common symbols to CoinGecko IDs
        symbol_map = {
            'btc': 'bitcoin',
            'eth': 'ethereum',
            'mon': 'monad'
        }
        coin_id = symbol_map.get(symbol.lower(), symbol.lower())
        data = cg.get_price(ids=coin_id, vs_currencies='usd')
        return data[coin_id]['usd']
    except Exception as e:
        logger.error(f"Error fetching price for {symbol}: {e}")
        return None

def ask_gpt(question):
    """Ask GPT-4 to determine the outcome of a question."""
    if not OPENAI_API_KEY:
        logger.warning("OpenAI API Key missing. Skipping GPT check.")
        return None
    
    try:
        response = openai.chat.completions.create(
            model="gpt-4-turbo",
            messages=[
                {"role": "system", "content": "You are a prediction market oracle. Your job is to determine the outcome of a market question based on recent knowledge or logic. Answer ONLY with 'Yes' or 'No' if possible, or the specific outcome string. If unsure, say 'Unsure'."},
                {"role": "user", "content": f"Question: {question}\nDetermine the outcome."}
            ]
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        logger.error(f"Error querying OpenAI: {e}")
        return None

def resolve_market(market_id, question, outcomes):
    """Determine the outcome of the market."""
    logger.info(f"Resolving Market #{market_id}: {question}")
    
    # 1. Crypto Price Logic (Simple Regex/Keyword check)
    if "$" in question and ("BTC" in question or "ETH" in question):
        # Example: "Will BTC hit $100,000?"
        # logic: parse target price and compare with current.
        # This is simplified; robust parsing would be needed for production.
        
        # Mock Logic for Demo:
        # If question contains "BTC", check BTC price.
        current_btc = get_crypto_price('bitcoin')
        logger.info(f"Current BTC Price: ${current_btc}")
        
        # Basic parsing (very naive for hackathon)
        import re
        target_price_match = re.search(r'\$?([\d,]+)', question)
        if target_price_match:
            target_price = float(target_price_match.group(1).replace(',', ''))
            is_above = current_btc >= target_price
            
            # Map to outcomes
            if "Yes" in outcomes and "No" in outcomes:
                return "Yes" if is_above else "No"

    # 2. General Knowledge (GPT-4)
    gpt_outcome = ask_gpt(question)
    if gpt_outcome in outcomes:
        return gpt_outcome

    # 3. Fallback (Random for Demo if no clear resolution)
    # logger.warning("Could not determine outcome deterministically. Falling back to Random (Demo Mode).")
    # import random
    # return random.choice(outcomes)
    
    return outcomes[0] # Default to first outcome if failing

def settle_market_on_chain(market_id, outcome):
    """Send transaction to settle the market."""
    try:
        logger.info(f"Submitting Settlement: Market #{market_id} -> {outcome}")
        
        tx = oracle_contract.functions.receiveSettlement(
            market_id,
            outcome,
            b'' # Empty proof for MVP
        ).build_transaction({
            'from': account.address,
            'nonce': w3.eth.get_transaction_count(account.address),
            'gas': 2000000,
            'gasPrice': w3.eth.gas_price
        })
        
        signed_tx = w3.eth.account.sign_transaction(tx, private_key=PRIVATE_KEY)
        tx_hash = w3.eth.send_raw_transaction(signed_tx.rawTransaction)
        logger.info(f"Settlement Tx Sent: {tx_hash.hex()}")
        
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
        if receipt.status == 1:
            logger.info("✅ Market Settled Successfully")
        else:
            logger.error("❌ Settlement Transaction Failed")
            
    except Exception as e:
        logger.error(f"Error sending settlement tx: {e}")

def main_loop():
    logger.info("Listening for markets...")
    while True:
        try:
            # 1. Fetch market count
            next_id = market_contract.functions.nextMarketId().call()
            
            # 2. Iterate all markets (Naive for MVP, efficient would be event logs)
            for m_id in range(next_id):
                market = market_contract.functions.markets(m_id).call()
                # market structure: [id, question, bettingDeadline, revealDeadline, revealed, finalOutcomeId, settled, totalPool]
                # indices: id=0, question=1, bettingDeadline=2, revealDeadline=3, revealed=4, finalOutcomeId=5, settled=6...
                
                is_settled = market[6]
                reveal_deadline = market[3]
                
                if not is_settled:
                    now = int(time.time())
                    
                    if now > reveal_deadline:
                        # Ready to settle!
                        question = market[1]
                        
                        # Fetch outcomes (need separate call or assuming structure)
                        outcomes = market_contract.functions.getMarketOutcomes(m_id).call()
                        
                        logger.info(f"Market #{m_id} is ready for settlement. (Expired {now - reveal_deadline}s ago)")
                        
                        final_outcome = resolve_market(m_id, question, outcomes)
                        if final_outcome:
                            settle_market_on_chain(m_id, final_outcome)
                        else:
                            logger.warning(f"Could not determine outcome for Market #{m_id}")
                            
            time.sleep(10) # Poll every 10 seconds
            
        except Exception as e:
            logger.error(f"Main loop error: {e}")
            time.sleep(5)

if __name__ == "__main__":
    main_loop()





# # 1. Activate the environment
# source oracle/venv/bin/activate

# # 2. Run the bot
# python oracle/oracle.py