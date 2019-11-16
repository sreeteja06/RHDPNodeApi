const sql = require('mssql');
const jwt = require('jsonwebtoken');
let { connection } = require("../db/sql_connect");

var authenticate = async (req, res, next) => {
	const token = req.header("x-auth");
	let pool;
	//checking of token validity and others are removed for now i.e. for develpment purpose
	try{
		if(!token){
			throw "No token Sent"
		}
		// const decoded = jwt.verify(token, process.env.JWT_SECRET);
		// console.log(decoded);
		pool = await connection.connect();
		let result = await pool.request().query("exec findByToken @inToken = '"+ token +"'" );
		req.userID = result.recordset[0].userID;
		req.token = token;
		pool.close();
		next();
	}catch(e){
		console.log(e);
		await pool.close();
		res.status(401).send(e);
		next();
	}
};

module.exports = {authenticate};
