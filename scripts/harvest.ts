import { ethers } from "hardhat";

import { FarmV2__factory, TokenV2__factory } from "../typechain-types";
import moment from "moment";
import { EventStruct } from "../typechain-types/FarmV2";
import axios from "axios";

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  let signers = await ethers.getSigners();
  let signerIndex = parseInt(process.env.WALLET || "1") - 1;
  let signer = signers[signerIndex];
  let signerAddress = signer.address;

  // 60 secondes * 1 minute
  let fruitQueJeVeux = 2;
  let nombreEmplacementDisponibleDansMaFerme = 5;

  var fruits:any = {
    1: {name: 'Fern', harvestTime: 1 * 60},
    2: {name: 'Bush', harvestTime: 5 * 60},
    3: {name: 'Bamboo', harvestTime: 60 * 60},
    4: {name: 'Fir', harvestTime: 4 * 60 * 60},
    5: {name: 'Olivier', harvestTime: 8 * 60 * 60},
    6: {name: 'Oak', harvestTime: 24 * 60 * 60},
    7: {name: 'Golden apple tree', harvestTime: 3 * 24 * 60 * 60},
  };
  
  while (true) {
    let farm_v2 = FarmV2__factory.connect(
      "0x3d5974b396056D30839Bc33B8099a8cf91d16Dba",
      signer
    );
    let sff = TokenV2__factory.connect(
      "0xd4569291Ed3fa1fdCBB9Dd774c6E8D396Ac40b4f",
      signer
    );

    console.log(signerIndex + 1, signers[signerIndex].address);
    console.log(moment().format());

    console.log(
      ethers.utils.formatEther(await sff.balanceOf(signerAddress)),
      "FF"
    );

    console.log("===== Lands =====");
    let farm = await farm_v2.getLand(signerAddress);
    for (const [i, place] of farm.entries()) {
      if( i >= nombreEmplacementDisponibleDansMaFerme) {
        break;
      }
      console.log(
        i,
        place.fruit,
        moment.unix(place.createdAt.toNumber()).format()
      );
    }


    let now = moment.utc().unix();
    
    const myFarm = farm.slice(0, nombreEmplacementDisponibleDansMaFerme);

    let lastHarvest = Math.max(
      ...myFarm.map((event) => {        
        return fruits[event.fruit].harvestTime - (now - event.createdAt.toNumber())
      })
    );

    if (lastHarvest > 0) {
      console.log("Next farming: ", lastHarvest, "s later");
      await delay((lastHarvest) * 1000);
      continue;
    }

    let events: EventStruct[] = [];

    for (const [i, place] of farm.entries()) {
      if( i >= nombreEmplacementDisponibleDansMaFerme) {
        break;
      }
      console.log(place);
      events.push({
        action: 1,
        createdAt: now,
        fruit: place.fruit,
        landIndex: i,
      });

      events.push({
        action: 0,
        createdAt: now,
        fruit: fruitQueJeVeux,
        landIndex: i,
      });
    }

    console.log("===== Gas =====");
    interface GasStation {
      safeLow: number,
      standard: number,
      fast: number,
      fastest: number,
      blockTime: string,
      blockNumber: string
    }
    let gasStation: GasStation;
    try {
      const { data } = await axios.get("https://gasstation-mainnet.matic.network/");
      gasStation = data;
    } catch (error) {
      console.log(error);
      await delay(1000 * 90);
      continue;
    }

    if (gasStation.standard > 100) {
      console.log("Gas price is too high!");
      await delay(1000 * 90);
      continue;
    }

    let gasPrice = ethers.utils.parseUnits(String(gasStation.safeLow), "gwei");

    try {
      let gas = await farm_v2.estimateGas.sync(events);
      console.log(ethers.utils.formatEther(gas.mul(gasPrice)), "MATIC");

      let sync = await farm_v2.sync(events, { gasLimit: gas.mul(2), gasPrice: gasPrice });
      let recipient = await sync.wait();
      console.log(recipient.transactionHash);
    } catch (e) {
      console.log(e);
      await delay(1000 * 20);
      continue;
    }

    console.log(
      ethers.utils.formatEther(await sff.balanceOf(signerAddress)),
      "FF"
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
