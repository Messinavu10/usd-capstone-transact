const sql = require('mssql');

const config = {
    user: process.env.DB_USERNAME, // better stored in an app setting such as process.env.DB_USER
    password: process.env.DB_PASSWORD, // better stored in an app setting such as process.env.DB_PASSWORD
    server: process.env.DB_HOSTNAME, // better stored in an app setting such as process.env.DB_SERVER
    port: 1433, // optional, defaults to 1433, better stored in an app setting such as process.env.DB_PORT
    database: 'usdtransactvc', // better stored in an app setting such as process.env.DB_NAME
    authentication: {
        type: 'default'
    },
    options: {
        encrypt: true
    }
}

const poolConnect = () => {
    return sql.connect(config);
}
 
const getCreds = async(email) => {
    var q = '
        SELECT
        FROM USERS as u
        INNER JOIN userRoles AS ur ON u.userID = ur.userID
        WHERE u.userEmail = '${email}';
        '

    var poolConnection = await poolConnect();

    var resultSet = await poolConnection.request().query(q);

    console.log(resultSet);

    return resultSet;
}

module.exports = getCreds;