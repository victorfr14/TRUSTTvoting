import React from 'react'

import { NavLink } from 'react-router-dom'

const PollList = ({state, onChange}) => (
	<div className="tab-pane active">
		<br />
		{state.pollList.length > 0 ?
		<table className="table table-hover">
			<thead>
				<tr>
					<th>#</th>
					<th>Title</th>
				</tr>
			</thead>
			<tbody>
				{state.pollList.map((title, i) => (
					<tr key={i}>
						<td>{i+1}</td>
						<td><NavLink style={{display: 'block'}} to={`/polls/${i+1}`}>{title}</NavLink></td>
					</tr>
				))}
			</tbody>
		</table> : state.arePollsLoaded && <h3>Nothing here yet...</h3>}

	</div>
)

export default PollList
