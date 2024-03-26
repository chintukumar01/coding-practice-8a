const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

function hasPriorityAndStatusProperties(query) {
  return query.hasOwnProperty("priority") && query.hasOwnProperty("status");
}

function hasPriorityProperty(query) {
  return query.hasOwnProperty("priority");
}

function hasStatusProperty(query) {
  return query.hasOwnProperty("status");
}

//API-1
app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodosQuery = "";
  const { search_q = "", priority, status } = request.query;

  switch (true) {
    case hasPriorityAndStatusProperties(request.query): //if this is true then below query is taken in the code
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE ?
    AND status = ?
    AND priority = ?;`;
      data = await db.all(getTodosQuery, [`%${search_q}%`, status, priority]);
      break;
    case hasPriorityProperty(request.query):
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE ?
    AND priority = ?;`;
      data = await db.all(getTodosQuery, [`%${search_q}%`, priority]);
      break;
    case hasStatusProperty(request.query):
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE ?
    AND status = ?;`;
      data = await db.all(getTodosQuery, [`%${search_q}%`, status]);
      break;
    default:
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE ?;`;
      data = await db.all(getTodosQuery, [`%${search_q}%`]);
  }

  response.send(data);
});

//API-2
// API-2
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
    SELECT
      *
    FROM
      todo
    WHERE
      id = ?;
  `;
  const todo = await db.get(getTodoQuery, [todoId]);
  if (todo) {
    response.send(todo);
  } else {
    response.status(404).send("Todo not found");
  }
});

// API-3: Create a todo
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;
  const createTodoQuery = `
    INSERT INTO todo (id, todo, priority, status)
    VALUES (?, ?, ?, ?);
  `;
  await db.run(createTodoQuery, [id, todo, priority, status]);
  response.send("Todo Successfully Added");
});

// API-4: Update a todo
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const { todo, priority, status } = request.body;

  let updateTodoQuery = `
    UPDATE todo
    SET 
  `;

  let responseMessage = "";

  if (status) {
    updateTodoQuery += `status = '${status}'`;
    responseMessage = "Status Updated";
  }

  if (priority) {
    updateTodoQuery += `, priority = '${priority}'`;
    responseMessage = "Priority Updated";
  }

  if (todo) {
    updateTodoQuery += `, todo = '${todo}'`;
    responseMessage = "Todo Updated";
  }

  updateTodoQuery += ` WHERE id = ${todoId};`;

  await db.run(updateTodoQuery);
  response.send(responseMessage);
});

// API-5: Delete a todo
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
    DELETE FROM todo
    WHERE id = ?;
  `;
  await db.run(deleteTodoQuery, [todoId]);
  response.send("Todo Deleted");
});
