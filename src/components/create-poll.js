import React from 'react'
import DateTimePicker from 'react-datetime-picker'

export default class extends React.Component {

	render() {
		let { state, onChange } = this.props

		return (
			<div className="tab-pane active">
				<form className="create-poll-form" onSubmit={e => {
					e.preventDefault()
					if (!(window.App && window.App.state.contract && window.App.createPoll)) 
						return window.alertify.error('Contrato ainda não disponível, você conectou com o MetaMask?')

					window.App.createPoll()
				}}>
					{/* <h3>Create a New Poll</h3>*/ }
					<br />
					<span style={{fontSize: '2rem'}}>Votação acaba em: &nbsp;&nbsp;</span> 

					<DateTimePicker 
						required 
						clearIcon={null}
						value={state.tempEndsOn}
						disableClock={true}
						onChange={date => {
							onChange({tempEndsOn: date})
						}}
						minDate={new Date()}
						showLeadingZeros={true} />
						<br />
					<br />

					<input value={state.tempTitle} 
						onChange={e => {
							onChange({tempTitle: e.target.value})
						}}
						className="form-control" maxLength="32" required
						placeholder="Título" autoFocus />
					<br />
					<textarea value={state.tempDescription} 
						onChange={e => {
							onChange({tempDescription: e.target.value})
						}}
						required style={{minHeight: '100px'}} 
						className="form-control" placeholder="Descrição"></textarea>
					
					<br />
					<br />
					<div style={{fontSize:'2rem'}}>Opções: </div>
					<br />
					{
						state.tempOptions.map((option, i) => 
							<input 
								required
								key={i}
								style={{marginBottom: '15px'}}
								value={option} 
								onChange={e => {
									let value = e.target.value
									let {tempOptions} = state
									tempOptions[i] = value
									onChange({tempOptions})
								}}
								className="form-control" 
								type='text' 
								placeholder={`Opção ${i+1}`}
								autoFocus={i+1 === state.tempOptions.length && i>1} 
								 />
						)
					}
					
					{state.tempOptions.length < 16 && <div className="text-right">
						<a

							onClick={e => {
								e.preventDefault()
								let { tempOptions } = state
								
								if (tempOptions.length >= 16) return;

								tempOptions = tempOptions.concat([''])
								onChange({ tempOptions })
							}} 
							style={{
							textDecoration: 'none',
							cursor: 'pointer'
						}}><i className="fa fa-plus-circle"></i> Adicionar uma opção</a>
					</div>}
					<br />
					<button className="btn btn-lg btn-primary">Confirmar</button>
				</form>
			</div>
		)
	}
}
