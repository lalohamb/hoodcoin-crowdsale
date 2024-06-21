const { expect } = require(`chai`);
const { ethers } = require(`hardhat`);

const tokens = (n) => {
	return ethers.utils.parseUnits(n.toString(), `ether`)
}

const ether = tokens 

//Does the same as above
// const ether = (n) => {
// 	return ethers.utils.parseUnits(n.toString(), `ether`)
// }


describe (`Crowdsale`, () => {
	let crowdsale, token
	let accounts, deployer, user1

	beforeEach(async () => {
		//load contracts
		const Crowdsale = await ethers.getContractFactory(`Crowdsale`)
		const Token = await ethers.getContractFactory(`Token`)
		
		//Deploy token
		token = await Token.deploy('Hood Coin', 'HOODC', '1000000')
		
		//Configure Accounts
		accounts = await ethers.getSigners()
		deployer = accounts[0] 
		user1 = accounts[1]
		
		//Deploy Crowdsale
		crowdsale = await Crowdsale.deploy(token.address, ether(1), `1000000`)   //(token.address) //, ether(1), `1000000`)
		
		//Send tokens to Crowdsale
		let transaction = await token.connect(deployer).transfer(crowdsale.address, tokens(1000000))
		await transaction.wait()
		})
	
	describe(`Deployment`, () => {
		it(`has correct name`, async () => {
			expect(await crowdsale.name()).to.equal("Crowdsale") 
		})

		it(`has returns price`, async () => {
			expect(await crowdsale.price()).to.equal(ether(1))  

		it(`has returns correct address`, async () => {
			expect(await crowdsale.token()).to.equal(token.address) 
		})
		it(`sends tokens to the Crowdsale contract`, async () => {
			expect(await token.balanceOf(crowdsale.address)).to.equal(tokens(1000000)) 
		})
		})

	describe(`Buying Tokens`, () => {
		let amount = tokens(10)
		let transaction 
		let result
		
		describe(`Success`, () => {
			beforeEach(async () => {
			transaction = await crowdsale.connect(user1).buyTokens(amount, { value: ether(10) })
			result = await transaction.wait() 

			})
			it(`it transfer tokens`, async () => {
				// let transaction = await crowdsale.connect(user1).buyTokens(amount)
				// let result = await transaction.wait() 
				expect(await token.balanceOf(crowdsale.address)).to.equal(tokens(999990)) 
				expect(await token.balanceOf(user1.address)).to.equal(amount)
				//expect(await token.balanceOf(user1.address)).to.equal(1)
			})	
			it(`it updates contract ethers balance`, async () => {
				expect(await ethers.provider.getBalance(crowdsale.address)).to.equal(amount)
				//expect(await token.balanceOf(user1.address)).to.equal(amount)
			})	

			it(`it updates tokenSold`, async () => {
				expect(await crowdsale.tokenSold()).to.equal(amount)
				//expect(await token.balanceOf(user1.address)).to.equal(amount)
			})	

			it('emits a buy event', async () => {
				//console.log(result)
				await expect(transaction).to.emit(crowdsale, `Buy`)
				.withArgs(amount, user1.address)
			})
		})

	describe(`Failure`, () => {
		it(`reject insufficent ETH amount`, async () => {
		await expect(crowdsale.connect(user1).buyTokens(tokens(10), { value: 0})).to.be.reverted
		})
		})

	describe(`Sending ETH`, () => {
		let transaction 
		let result
		let amount = tokens(10)
		
		describe(`Success`, () => {

			beforeEach(async () => {
				transaction = await user1.sendTransaction({to: crowdsale.address, value: amount })
				result = await transaction.wait()
			})

			it(`it updates contract ethers balance`, async () => {
				expect(await ethers.provider.getBalance(crowdsale.address)).to.equal(amount)
			})	
				it(`it updates user token balance`, async () => {
				expect(await token.balanceOf(user1.address)).to.equal(amount)
			})	

		})

		describe(`Update price`, () => {
			let transaction, result
			let price = ether(10)

			describe(`Success`, () => {

				beforeEach(async () => {
					transaction = await crowdsale.connect(deployer).setPrice(ether(2))
					result = await transaction.wait()
				})
				it(`updates the price`, async () => {
					expect(await crowdsale.price()).to.equal(ether(2))

				})
			})
			
			describe(`Failure`, () => {
				it(`prevents non-owner from updating price`, async () => {
				await expect(crowdsale.connect(user1).setPrice(price)).to.be.reverted
			})

		})

		describe(`Finalizing sale`, () => {
			let transaction, result
			let amount = tokens(10)
			let value = ether(10)

			describe(`Success`, () => {
				beforeEach(async () => {
				transaction = await crowdsale.connect(user1).buyTokens(amount, {value: value })
				result	= await transaction.wait()

				transaction = await crowdsale.connect(deployer).finalize()
				result = await transaction.wait()
			})

				it(`transfers remaining tokens to owner`, async () => {
					expect(await token.balanceOf(crowdsale.address)).to.equal(0)
					expect(await token.balanceOf(deployer.address)).to.equal(tokens(999990))
				})

				it(`transfers ETH balance to owner`, async () => {
					expect(await ethers.provider.getBalance(crowdsale.address)).to.equal(0)
				})

				it(`emits Finalize Event`, async () => {
					await expect(transaction).to.emit(crowdsale, "Finalize")
					.withArgs(amount, value)
				})
			})

			describe(`Failure`, () => {
				//Prevent nonOwner from finalizing Crowdsale ##Comment out [require(msg.sender == owner);] to test. 
				it(`Prevent nonOwner from finalizing Crowdsale`, async () => {
					//await crowdsale.connect(user1).finalize()
					await expect(crowdsale.connect(user1).finalize()).to.be.reverted
				})
			})
		})
	})
})
})
})
})
