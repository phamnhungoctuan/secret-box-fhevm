// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint64, euint8, externalEuint8} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

contract SecretBox is ZamaEthereumConfig {
    euint64[] private boxes;

    uint8 public immutable numberOfBoxes;

    constructor(uint64[] memory _rewards) {
        require(_rewards.length > 0, "No boxes");
        require(_rewards.length <= type(uint8).max, "Too many boxes");

        numberOfBoxes = uint8(_rewards.length);

        for (uint256 i = 0; i < _rewards.length; i++) {
            euint64 encryptedReward = FHE.asEuint64(_rewards[i]);
            boxes.push(encryptedReward);

            FHE.allowThis(encryptedReward);
        }
    }

    function openBox(
        externalEuint8 choiceEncrypted,
        bytes calldata inputProof
    ) external returns (euint64 reward) {
        euint8 choice = FHE.fromExternal(choiceEncrypted, inputProof);

        reward = FHE.asEuint64(0);

        for (uint8 i = 0; i < numberOfBoxes; i++) {
            reward = FHE.select(
                FHE.eq(choice, FHE.asEuint8(i)),
                boxes[i],
                reward
            );
        }

        FHE.allowThis(reward);
        FHE.allow(reward, msg.sender);

        return reward;
    }
}
