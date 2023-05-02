const sql = require("mssql");

const config = {
  user: process.env.DB_USERNAME, // better stored in an app setting such as process.env.DB_USER
  password: process.env.DB_PASSWORD, // better stored in an app setting such as process.env.DB_PASSWORD
  server: process.env.DB_HOSTNAME, // better stored in an app setting such as process.env.DB_SERVER
  port: 1433, // optional, defaults to 1433, better stored in an app setting such as process.env.DB_PORT
  database: "usdtransactvc", // better stored in an app setting such as process.env.DB_NAME
  authentication: {
    type: "default",
  },
  options: {
    encrypt: true,
  },
};

const poolConnect = async () => {
  return sql.connect(config);
};

module.exports.getRoles = async (userEmail) => {
  var q = `
    SELECT LOWER(r.roleName) AS roleName
    FROM USERS AS u
    INNER JOIN userRoles AS ur ON u.userID = ur.userID
    INNER JOIN ROLES AS r ON r.roleID = ur.roleID
    WHERE u.userEmail = '${userEmail}';
    `;
  var poolConnection = await poolConnect();

  const resultSet = await poolConnection.request().query(q);
  const results = resultSet.recordset.map((x) => x.roleName);
  console.log(results);
  return results; // array of roles from 0 to 2 roles
};

module.exports.getUserAttribute = async (userEmail) => {
  const result = {
    firstName: "",
    lastName: "",
    gpa: "",
    department: "",
    major: "",
    birthday: "",
  };

  var q1 = `
    SELECT userName
    FROM USERS AS u
    WHERE u.userEmail = '${userEmail}';
    `;

  var q2 = `
    SELECT attributeName, attributeValue
    FROM USERS AS u
    INNER JOIN UserAttributes AS ua ON u.userID = ua.userID
    WHERE u.userEmail = '${userEmail}';
    `;

  try {
    var poolConnection = await poolConnect();

    const name = await poolConnection.request().query(q1);
    const userName = name.recordset[0].userName;
    const otherAttr = await poolConnection.request().query(q2);
    console.log("-------------------------");
    console.log(otherAttr.recordset);

    for (var i = 0; i < otherAttr.recordset.length; i++) {
      const attr = otherAttr.recordset[i];
      result[attr.attributeName] = attr.attributeValue;
    }

    // split the userName into first and last name
    [result.firstName, result.lastName] = userName.split(" ");

  } catch (err) {
    console.log(err);
  }

  return result;
};

async function connectAndQuery(email) {
  try {
    console.log(JSON.stringify(config), "\n\n");

    var poolConnection = await poolConnect();

    console.log("Reading rows from the Table...");
    var q = `SELECT USERS.userName, USERS.userEmail, ua.attributeName, ua.attributeValue
        FROM USERS
        INNER JOIN UserAttributes AS ua ON USERS.userID = ua.userID
        WHERE USERS.userEmail = '${email}';`;
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
    resultSet.recordset.forEach((row) => {
      rows.push(row);
      console.log(
        "%s\t%s\t%s\t%s",
        row.userName,
        row.userEmail,
        row.attributeName,
        row.attributeValue
      );
    });

    // close connection only when we're certain application is finished
    poolConnection.close();
  } catch (err) {
    console.error(err.message);
  }
  return rows;
}