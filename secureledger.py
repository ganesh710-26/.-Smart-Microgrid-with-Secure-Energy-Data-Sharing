import hashlib
import json
import datetime
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import hashes, serialization
def generate_keys():
    private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    public_key = private_key.public_key()
    return private_key, public_key
def sign_data(private_key, data_dict):
    message = json.dumps(data_dict, sort_keys=True).encode()
    signature = private_key.sign(
        message,
        padding.PSS(mgf=padding.MGF1(hashes.SHA256()), salt_length=padding.PSS.MAX_LENGTH),
        hashes.SHA256()
    )
    return signature
def verify_signature(public_key, data_dict, signature):
    message = json.dumps(data_dict, sort_keys=True).encode()
    try:
        public_key.verify(
            signature,
            message,
            padding.PSS(mgf=padding.MGF1(hashes.SHA256()), salt_length=padding.PSS.MAX_LENGTH),
            hashes.SHA256()
        )
        return True
    except Exception:
        return False
class Ledger:
    def __init__(self):
        self.chain = []
    
    def add_block(self, data, signature):
        prev_hash = self.chain[-1]["hash"] if self.chain else "0"
        record = {
            "timestamp": str(datetime.datetime.now()),
            "data": data,
            "signature": signature.hex(),
            "prev_hash": prev_hash
        }
        # Hash of this block
        record_str = json.dumps(record, sort_keys=True).encode()
        record_hash = hashlib.sha256(record_str).hexdigest()
        record["hash"] = record_hash
        self.chain.append(record)
    
    def verify_chain(self):
        for i in range(len(self.chain)):
            block = self.chain[i]
            # Recalculate hash
            recalculated = hashlib.sha256(json.dumps({
                "timestamp": block["timestamp"],
                "data": block["data"],
                "signature": block["signature"],
                "prev_hash": block["prev_hash"]
            }, sort_keys=True).encode()).hexdigest()
        
            if recalculated != block["hash"]:
                return False
        
            # Verify chain linkage
            if i > 0 and block["prev_hash"] != self.chain[i-1]["hash"]:
                return False
        return True

from microgridsimulation import run_simulation

if __name__ == "__main__":
    private_key, public_key = generate_keys()
    ledger = Ledger()

    df = run_simulation()

    for _, row in df.iterrows():
        data = row.to_dict()
        signature = sign_data(private_key, data)
        ledger.add_block(data, signature)

    # Verify the chain
    print("Ledger verification:", "✅ OK" if ledger.verify_chain() else "❌ Failed")

    # Try tampering with one record
    ledger.chain[5]["data"]["solar_kW"] = 12.9
    print("After Tampering:", "✅ OK" if ledger.verify_chain() else "❌ Failed (Tampered!)")
