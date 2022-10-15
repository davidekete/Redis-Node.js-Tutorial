import express from "express";
import axios from "axios";
import { createClient } from "redis";

const app = express();
const port = process.env.PORT || 3000;

//Creating a Redis client
const redisClient = createClient();

//Listening for error event
redisClient.on("error", (error) => console.log(error));

//Connecting application to NodeJS
await redisClient.connect();

const fetchApiData = async function (id) {
  try {
    const { data } = await axios.get(
      `https://jsonplaceholder.typicode.com/posts/${id || ""}`
    );

    return data;
  } catch (error) {
    console.log(error);
  }
};

//All resources
app.get("/posts", async (req, res) => {
  // Getting Data from Redis
  const cache = await redisClient.get("posts");

  // If Data is Stored in Redis
  if (cache != null) {
    console.log("Data from cache");

    res.json(JSON.parse(cache));
  } else {
    // If Data is not Stored in Redis

    // Get data from API
    const data = await fetchApiData();
    console.log("Data from API");

    // Saving Unique Data to Redis with Expiration
    redisClient.set("posts", JSON.stringify(data), { EX: 600, NX: true });

    res.json(data);
  }
});

//Single resource
app.get("/posts/:id", async (req, res) => {
  // Extracting ID from params object
  const { id } = req.params;

  // Fetching Cache from Redis
  const cache = await redisClient.get("post");

  // If Data Stored in Redis
  if (cache != null) {
    console.log("Data from cache");

    res.json(JSON.parse(cache));
  } else {
    // If Data is not Stored in Redis

    // Get data from API
    const data = await fetchApiData(id);
    console.log("Data from API");

    // Saving Unique Data to Redis with Expiration
    redisClient.set("post", JSON.stringify(data), { EX: 600, NX: true });

    res.json(data);
  }
});

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});
