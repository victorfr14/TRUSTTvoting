import React from 'react'
import { NavLink } from 'react-router-dom'

export default class PollDetails extends React.Component {
	
	constructor(props) {
		super(props)
		this.state = {
			isContractAvailable: false,
			isPollLoaded: false,
			poll: {

			}
		}
	}

	refreshPoll() {
		let {state, pollIndex} = this.props;
		if (!state.contract||!pollIndex) return;

		state.contract.methods.getPoll(pollIndex).call()
			.then(_poll => {
				console.log(_poll)
				let poll = {}
				
				poll.pollIndex = pollIndex
				poll.title = window.web3.utils.toAscii(_poll[0]).replace(/\0/g,'')
				poll.description = _poll[1]
				poll.options = _poll[2]
				poll.votes = _poll[3]
				poll.endsOnUnix = _poll[4]
				poll.creatorAddress = _poll[5]
				// poll.hasEnded = Date.now()/1e3 > Number(_poll[4])

				poll.totalVotes = poll.votes.map(Number).reduce((a,b) => a+b)

				try {
					let date = new Date(Number(_poll[4])*1e3)
					poll.endsOn = date.toDateString()+' at '+date.toLocaleTimeString()
				} catch(e) {
					console.error(e)
				}

				this.setState({poll, isContractAvailable: true, isPollLoaded: true},
					() => this.refreshVotedFor())
			})
	}

	refreshVotedFor() {
		return new Promise(async (resolve, reject) => {
			let { contract } = this.props.state
			if (!this.state.isPollLoaded) return reject('Votação ainda não carregada!')
			if (!contract) return reject('Contrato ainda não carregado!')

			contract.methods.votedFor(await window.web3.eth.getCoinbase(), 
				this.state.poll.pollIndex).call().then(res => {
					let { poll } = this.state
					poll.votedFor = Number(res)
					this.setState(poll)
					return resolve(Number(res))
				})
				.catch(console.error)
		})
	}

	async voteFor(_pollIndex, _optionIndex) {
		let { state, onChange } = this.props
		let { contract } = state

		if (!this.state.isPollLoaded || !contract) return;

		if (Date.now()/1e3>Number(this.state.poll.endsOnUnix)) {
			this.refreshPoll()
			return window.alertify.error("A votação acabou!")
		}

		try {
			let votedFor = await this.refreshVotedFor()
			if (votedFor > 0) 
				return window.alertify.error("Você já votou nessa eleição!")
		} catch (e) { console.error(e) }

		let hash

		const cb = (err, txHash) => {
			console.log(err, txHash)
			if (err) return;
			let currentTx = {status: 'pending', txHash}
			hash = txHash
			onChange({currentTx})
		}

		console.log(`voteFor(${_pollIndex}, ${_optionIndex})`)

		contract.methods.vote(_pollIndex, _optionIndex)
			.send({gasPrice: 1e10}, cb)
			.then(receipt => {
				console.log(receipt)
				// let poll = this.state.poll
				// poll.votedFor = _optionIndex+1
				// this.setState({poll}, () => this.refreshPoll())

				if (receipt.status === true &&
					window.App.state.currentTx.txHash === receipt.transactionHash) {
					let {currentTx} = window.App.state
					currentTx.status = 'confirmed'
					onChange({currentTx}, () => this.refreshPoll())
					window.alertify.success('Transação confirmada!')
				}

			})
			.catch(err => {
				window.alertify.error(String(err))


				if (window.App.state.currentTx.txHash === hash) {
					let {currentTx} = window.App.state
					currentTx.status = 'failed'
					onChange({currentTx})
				}

			})
	}

	componentDidMount() {
		this.refreshPoll()
	}

	componentWillReceiveProps(newProps) {
		let { state } = this.props
		if (!this.state.isContractAvailable && state.contract) {
			this.refreshPoll()
			this.setState({isContractAvailable: true})
		}
	}

	render() {
		let { poll } = this.state
		return (
			this.state.isPollLoaded?
			<div>
				<h2>
					<NavLink to="/">
						<span
							title="Voltar para lista de votação" 
							className="fa fa-arrow-circle-left go-back"></span>
					</NavLink>
					{poll.title}
				</h2>

				<p>{poll.description}</p>
				<hr />
					ACABOU: <strong>{Date.now()/1e3 > Number(poll.endsOnUnix)? 
						"SIM" : "NÃO"}</strong><br />
					Acaba em: <strong>{poll.endsOn}</strong><br />
					Total de Votos: <strong>{poll.totalVotes}</strong><br />
					Endereço do Criador: <code>{poll.creatorAddress}</code>
				<hr />
				{
					poll.options.map((option,i) => 
					
					<div
						onClick={() => {
							console.log("CLICKED")
							this.voteFor(poll.pollIndex, i)
						}} 
						className="poll-option row" key={i}>
						<div style={{
							minWidth: parseInt((poll.votes[i]/(poll.totalVotes||1))*100)+'%'
						}} className="poll-option-vote-percent"></div>

						<div className="col-xs-9">
							<span className={`far fa-${
								poll.votedFor - 1 === i?'check-':''
								}square`}></span>&nbsp;&nbsp; {option}
						</div>
						<div className="col-xs-3 text-right">
							{poll.votes[i]} voto{poll.votes[i]>1&&'s'} - {
								parseInt((poll.votes[i]/(poll.totalVotes||1))*100)
							} %
						</div>
					</div>)
				}
			</div>
			: ""
			)
	}
}
