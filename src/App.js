import React, { Component } from 'react';
import { Route, NavLink, withRouter, Redirect } from 'react-router-dom'

import PollList from './components/poll-list'
import CreatePoll from './components/create-poll'
import PollDetails from './components/poll-details'

import './App.css';


let { alertify, config } = window

class App extends Component {

  constructor(props) {
    super(props)
    this.state = {
      isUnlocked: false,
      contract: null,
      pollList: [],
      arePollsLoaded: false,
      currentTx: {
        txHash: '',
        status: ''
      },

      tempTitle:'',
      tempDescription: '',
      tempEndsOn: new Date(Date.now() + 2*24*60*60*1e3),
      tempOptions: ['', '']
    }

    window.App = this
  }

  refreshPollList() {
    if (!this.state.contract) return;

    this.state.contract.methods.getTitles().call()
      .then(pollList => {
        
        pollList = pollList.map(title => 
          window.web3.utils.toAscii(title)
          .replace(/\0/g,''))

        console.log(pollList)

        this.setState({pollList, arePollsLoaded: true})
      })
      .catch(console.error)
  }

  createPoll() {
    let { state } = this
    let { contract } = state
    
    if (!contract) return alertify.error('Contract not available yet, did you connect to MetaMask?')

    let hash
    let cb = (err, txHash) => {
      if (err) return;
      hash = txHash
      let currentTx = {txHash, status: 'pending'}
      this.setState({ currentTx })
    }
    let title = state.tempTitle,
      description = state.tempDescription,
      options = state.tempOptions,
      endsOn = parseInt(state.tempEndsOn.getTime()/1e3)

    if (!title.trim()) return window.alertify.error('Invalid title!')

    if (!description.trim()) return window.alertify.error('Invalid description!')

    let invalidOptionIndex;

    if (options.some((option, i) => {
      if (!option.trim()) {
        invalidOptionIndex = i
        return true
      }
      return false
    })) {
      return alertify.error(`Invalid option number ${(invalidOptionIndex+1)}`)
    }

    title = window.web3.utils.toHex(title)

    contract.methods.createPoll(
      title, description, options, endsOn
    ).send({gasPrice: 1e10}, cb)
    .then(receipt => {

      this.refreshPollList()
      if (receipt.transactionHash === this.state.currentTx.txHash) {
        let { currentTx } = this.state
        currentTx.status = 'confirmed'
        this.setState({ currentTx })
      }

      if (receipt.status === true) {
        window.alertify.success('Transaction confirmed!')
        console.log(receipt)
        window.location.href = '/polls/'+receipt.events.newPoll.returnValues.pollIndex
      }
    })
    .catch(err => {
      window.alertify.error(String(err))
      if (hash === this.state.currentTx.txHash) {
        let { currentTx } = this.state
        currentTx.status = 'failed'
        this.setState({ currentTx })
      }
    })

  }

  componentDidMount() {
    window.addEventListener('load', async () => {
      if (window.ethereum && window.ethereum.enable) {
        try {
          await window.ethereum.enable()
        } catch (e) {
          return alertify.error('MetaMask connect request rejected!')
        }
      } else if (typeof window.web3 === 'undefined') {
        return alertify.error('Please install MetaMask to use this DAPP!')      
      }

      window.web3 = new window.Web3(window.web3.currentProvider)

      let ethAccount = await window.web3.eth.getCoinbase()

      let contract = new window.web3.eth.Contract(window.ABI, config.contract_address, 
                                          {from: ethAccount})

      this.setState({isUnlocked: true, contract}, this.refreshPollList)

      setInterval(() => {
        window.web3.eth.getCoinbase().then(coinbase => {
          if (coinbase !== ethAccount) window.location.reload()
        })
      }, 500)
      console.log("Inverval Set!")

    })

  }

  render() {
    let {props, state} = this
    return (
      <div className="App container">
        <h2> TRUSTT </h2>
        <p>Solução de Votação em Blockchain</p>

        {
        !props.location.pathname.startsWith('/polls/')?<div>
          <ul className="nav nav-tabs">
            <li className={getActiveClassName(props, "")}>
              <NavLink to="/">
                <span className='fa fa-poll'></span>&nbsp;&nbsp;Todas as Votações
              </NavLink></li>
            <li className={getActiveClassName(props, "new")}>
              <NavLink to="/new">
                <span className='fa fa-pen-fancy'></span>&nbsp;&nbsp;Nova Votação
              </NavLink></li>
          </ul>

          <div className="tab-content">
            
            <Route exact path="/" render={() => 
              <PollList state={state} onChange={(obj, cb) => this.setState(obj, cb)} /> 
            } />

            <Route exact path="/new" render={() => 
              <CreatePoll state={state} onChange={(obj, cb) => this.setState(obj, cb)} />
            } />
          </div>

          <Tx state={this.state} />

        </div>
        :
        <div>
          <Route exact path="/polls" render={() => <Redirect to="/polls/1" />} />
          <Route exact path="/polls/:pollIndex" render={({match}) => (
            <PollDetails 

              pollIndex={match.params.pollIndex}
              state={this.state} 
              onChange={(obj, cb) => this.setState(obj, cb)} />
          )} />
          <Tx state={this.state} />
        </div>
        }

      </div>
    );
  }
}

function Tx({ state }) {
  let { currentTx } = state

  return (
    currentTx.txHash && <div>
    <br />
      <span style={{
        color: ({pending: 'orange', failed: 'red', confirmed: 'green'})[currentTx.status],
        fontSize: '2rem',
        fontWeight: 'bold'
      }}>
        <span className={`fa ${
          ({pending: 'fa-spin fa-spinner', failed: 'fa-times', confirmed: 'fa-check'})[currentTx.status]
        }`}></span> &nbsp;Transaction {currentTx.status}: </span> 
      <a 
      rel="noopener noreferrer"
      target='_blank'
      href={`https://${
        window.config.chain_id===4?'rinkeby.':''}etherscan.io/tx/${currentTx.txHash}`}>
        {currentTx.txHash}</a>
    </div>
  )
}

function getActiveClassName(props, path) {
  return props.location.pathname === "/"+path ? "active" : ""
}

export default withRouter(App);
