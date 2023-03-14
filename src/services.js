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

const connect = async() => {
    var poolConnection = await sql.connect(config);
    return poolConnection;
}

export const getQueryRole = (userEmail, poolConnection) => {
    var q = `
    select from rowsTable, userRolesTable,
    make a sql statement to filter the role of the user `
    var resultSet = await poolConnection.request().query(q);

    return resultSet; // array of roles from 0 to 2 roles

}


async function connectAndQuery(email) {
    try {
        console.log(JSON.stringify(config),"\n\n");

        var poolConnection = await connect();

        console.log("Reading rows from the Table...");
        var q = `SELECT USERS.userName, USERS.userEmail, ua.attributeName, ua.attributeValue
        FROM USERS
        INNER JOIN UserAttributes AS ua ON USERS.userID = ua.userID
        WHERE USERS.userEmail = '${email}';`
        console.log(q);
        var resultSet = await poolConnection.request().query(q);

        console.log(`${resultSet.recordset.length} rows returned.`);

        // output column headers
        var columns = "";
        for (var column in resultSet.recordset.columns) {
            columns += column + ", ";
        }
        console.log("%s\t", columns.substring(0, columns.length - 2));

        // ouput row contents from default record set
        var rows = [];
        resultSet.recordset.forEach(row => {
            rows.push(row);
            console.log("%s\t%s\t%s\t%s", row.userName, row.userEmail, row.attributeName, row.attributeValue);
        });

        // close connection only when we're certain application is finished
        poolConnection.close();
    } catch (err) {
        console.error(err.message);
    }
    return rows;
}


