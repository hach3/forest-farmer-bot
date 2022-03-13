# Farming Bot for Forest Farmer
This repository includes a farming bot. Use the script harvest.ts to automatically harvest your plants.

## How to Use

```shell
# install deps
yarn

# set your private keys
vim hardhat.config.ts 

# Step 1: Send MATIC and SFF to your farm wallet

# Step 2: Create your farm by hand

# Step 3: Earn without playing 
env WALLET=1 npx hardhat run scripts/harvest.ts --network polygon
```

## FAQ

### Why do you publish bot?
So you can earn money while you sleep. I feel less guilty if I share it =D

## Licenses
- scripts/*.ts: me (MIT License) No wannary