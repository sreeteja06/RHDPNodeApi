const sql = require('mssql');
var authenticate = async (req, res, next) => {
	const token = req.header("x-auth");
	try{
		let result = await req.db.query("exec findByToken @inToken = '"+ token +"'" );
		req.userID = result.recordset[0].userID;
		req.token = token;
		next();
	}catch(e){
		await sql.close();
		res.status(401).send(e);
	}
};

module.exports = {authenticate};