const sql = require('mssql');
const jwt = require('jsonwebtoken');
var authenticate = async (req, res, next) => {
	const token = req.header("x-auth");
	try{
		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		// console.log(decoded);
		let result = await req.db.query("exec findByToken @inToken = '"+ token +"'" );
		req.userID = result.recordset[0].userID;
		req.token = token;
		next();
	}catch(e){
		await sql.close();
		console.log(e);
		res.status(401).send(e);
	}
};

module.exports = {authenticate};
