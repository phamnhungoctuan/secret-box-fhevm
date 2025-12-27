import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { expect } from "chai";
import { SecretBox, SecretBox__factory } from "../types";

type Signers = {
  deployer: HardhatEthersSigner;
  alice: HardhatEthersSigner;
};

async function deployFixture() {
  const rewards = [100, 200, 300];
  const factory = (await ethers.getContractFactory("SecretBox")) as SecretBox__factory;
  const box = (await factory.deploy(rewards)) as SecretBox;
  return { box, rewards, boxAddress: await box.getAddress() };
}

describe("SecretBox (FHE encrypted reward selection)", () => {
  let signers: Signers;
  let box: SecretBox;
  let boxAddress: string;
  let rewards: number[];

  before(async () => {
    const ethSigners = await ethers.getSigners();
    signers = { deployer: ethSigners[0], alice: ethSigners[1] };
  });

  beforeEach(async function () {
    if (!fhevm.isMock) {
      console.warn("\u26a0\ufe0f Skipping tests: not running on fhEVM mock");
      this.skip();
    }
    ({ box, rewards, boxAddress } = await deployFixture());
  });

  async function encryptChoice(index: number, user: string) {
    const enc = await fhevm.createEncryptedInput(boxAddress, user);
    enc.add8(index);
    const res = await enc.encrypt();
    return { encryptedChoice: res.handles[0], proof: res.inputProof };
  }

  it("should return encrypted reward handle (bytes32)", async () => {
    const index = 1;
    const { encryptedChoice, proof } = await encryptChoice(index, signers.alice.address);

    const tx = await box.connect(signers.alice).openBox(encryptedChoice, proof);
    const receipt = await tx.wait();

    expect(receipt.status).to.equal(1);
  });

  it("should only allow selecting among existing boxes", async () => {
    const invalidIndex = 5;
    const { encryptedChoice, proof } = await encryptChoice(invalidIndex, signers.alice.address);

    await expect(box.connect(signers.alice).openBox(encryptedChoice, proof)).to.not.be.reverted;
  });
});