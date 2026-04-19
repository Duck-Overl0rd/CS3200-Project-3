# CS3200-Project-3


## About
ClassFriends is a social scheduling platform where students can add 
friends and compare class schedules. This project extends the 
ClassFriends app from Projects 1 and 2 by adding a Redis in-memory 
layer to support three real-time features: most viewed profiles, 
online user tracking, and a pending friend request inbox.

## Tech Stack
- Node.js + Express
- Redis (via Docker)
- Tested with Thunder Client

## How to Run
1. Start your Redis Docker container
2. (For Redis Insight only) To populate Redis with sample data, run `node seed.js` before starting the server.
3. Run `node app.js`
4. API available at `http://localhost:3000`

### Notes:
- I've added package-lock.json into .gitignore since package.json already has the details needed.

- While it will be mentioned again when relevant, Task 4 requires either 1. The VSCode extension "Thunder Client" be installed. Or 2. The Redis GUI, Redis Insight + Docker Desktop should be installed.

---

## Tasks

### 1. Provide the problem requirements and the conceptual model in UML for your project.

Here is the requirements document:
[Requirements Document for Project 3](Requirements%20Document%20for%20Project%203.pdf)

Additionally, here is the UML class diagram below.

Note: The UML diagram was reused from Project 1 & 2 as permitted by the assignment. However, the Requirements document was slightly modified to include the Redis features.

![UML Diagram](UML%20Diagram.png)

---

### 2. Describe the Redis data structures that you are going to use to implement the functionalities you described in the previous point.

#### Feature 1: Most Viewed Profiles
To implement most viewed profiles, **I will use a Redis sorted set** with the key profileViews. Each member is a user's email address, and the score is the total number of times that profile has been visited. A sorted set is the right structure here because it stores members with a numeric score and keeps them automatically ranked — so fetching the top N most viewed profiles requires no sorting logic on the application side.
Example: `profileViews` → `{ "alice@email.com": 42, "bob@email.com": 17 }`

#### Feature 2: Online/Active Users
To implement online user tracking, **I will use a Redis set** with the key onlineUsers. Each member is a user's email address. A set is appropriate here because membership is binary — a user is either online or they aren't — and sets guarantee no duplicates. Adding a user on login, removing them on logout, and checking whether a specific user is online are all constant-time operations with a set.
Example: `onlineUsers` → `{ "alice@email.com", "carol@email.com" }`

#### Feature 3: Pending Friend Request Inbox
To implement the pending friend request inbox, **I will use a Redis list** per user, with the key friendRequests:<email> where <email> is the email of the user receiving the requests. Each element in the list is the email address of the user who sent the request. A list is appropriate here because friend requests arrive in order and should be displayed chronologically, and new requests are simply appended to the end.
Example: `friendRequests:alice@email.com` → `["bob@email.com", "david@email.com"]`

---

### 3. The Redis commands that you would use to interact with your specific Redis structures.

The three features will utilize all of the CRUD commands.

#### Feature 1: Most Viewed Profiles (Sorted Set)

- Initialize: FLUSHALL
- Create/Update — record a profile view for alice@email.com: ZINCRBY profileViews 1 alice@email.com
- Read — get all profiles ranked by views, highest first: ZREVRANGE profileViews 0 -1 WITHSCORES
- Read — get top 3 most viewed profiles: ZREVRANGE profileViews 0 2 WITHSCORES
- Read — get the view count for a specific user: ZSCORE profileViews alice@email.com
- Delete — remove a specific user from the leaderboard: ZREM profileViews alice@email.com
- Delete — remove the entire leaderboard: DEL profileViews

#### Feature 2: Online/Active Users (Set)

- Initialize: FLUSHALL
- Create — mark alice@email.com as online (on login): SADD onlineUsers alice@email.com
- Read — get all currently online users: SMEMBERS onlineUsers
- Read — check if a specific user is online: SISMEMBER onlineUsers alice@email.com
- Delete — mark alice@email.com as offline (on logout): SREM onlineUsers alice@email.com
- Delete — clear all online users: DEL onlineUsers

#### Feature 3: Pending Friend Request Inbox (List)

- Initialize: FLUSHALL
- Create — send a friend request from bob@email.com to alice@email.com: RPUSH friendRequests:alice@email.com bob@email.com
- Read — view all pending requests for alice@email.com: LRANGE friendRequests:alice@email.com 0 -1
- Read — check how many pending requests alice@email.com has: LLEN friendRequests:alice@email.com
- Delete — remove a specific request (e.g. bob@email.com's request to alice): LREM friendRequests:alice@email.com 1 bob@email.com
- Delete — clear alice@email.com's entire inbox: DEL friendRequests:alice@email.com

---

### 4. Create a basic Node + Express application that let's you create, display, modify and delete at least one Redis data structure from the ones describe in the previous point.

I will be doing Task 4, and not Task 5. Because Task 4 awards 20 more points (30 pts) compared to Task 5 (10 pts).

## Testing the API

There are two ways to interact with the ClassFriends Redis API: through the REST endpoints using Thunder Client in VSCode, or directly through the Redis CLI in Redis Insight.

### Option A: Thunder Client (REST API)

Make sure the server is running (`node app.js`) before sending any requests.

#### Feature 1: Most Viewed Profiles

| Action | Method | URL |
|---|---|---|
| Record a profile view | POST | `http://localhost:3000/profileViews/:email` |
| Get full leaderboard | GET | `http://localhost:3000/profileViews` |
| Get one user's view count | GET | `http://localhost:3000/profileViews/:email` |
| Remove one user | DELETE | `http://localhost:3000/profileViews/:email` |
| Clear entire leaderboard | DELETE | `http://localhost:3000/profileViews` |

#### Feature 2: Online Users

| Action | Method | URL |
|---|---|---|
| Mark user as online | POST | `http://localhost:3000/onlineUsers/:email` |
| Get all online users | GET | `http://localhost:3000/onlineUsers` |
| Check if user is online | GET | `http://localhost:3000/onlineUsers/:email` |
| Mark user as offline | DELETE | `http://localhost:3000/onlineUsers/:email` |
| Clear all online users | DELETE | `http://localhost:3000/onlineUsers` |

#### Feature 3: Friend Requests

| Action | Method | URL | Body |
|---|---|---|---|
| Send a friend request | POST | `http://localhost:3000/friendRequests/alice@email.com` | `{ "senderEmail": "bob@email.com" }` |
| View pending requests | GET | `http://localhost:3000/friendRequests/alice@email.com` | — |
| Remove a specific request | DELETE | `http://localhost:3000/friendRequests/alice@email.com/bob@email.com` | — |
| Clear all requests | DELETE | `http://localhost:3000/friendRequests/alice@email.com` | — |

---

### Option B: Redis Insight CLI

Open Redis Insight, connect to `127.0.0.1:6379`, and click the **CLI** button at the bottom of the screen. The server does not need to be running to use these commands.

#### Feature 1: Most Viewed Profiles

```
# Record a profile view
ZINCRBY profileViews 1 alice@email.com

# Get full leaderboard (highest first)
ZREVRANGE profileViews 0 -1 WITHSCORES

# Get top 3 most viewed
ZREVRANGE profileViews 0 2 WITHSCORES

# Get view count for a specific user
ZSCORE profileViews alice@email.com

# Remove a specific user from the leaderboard
ZREM profileViews alice@email.com

# Clear the entire leaderboard
DEL profileViews
```

#### Feature 2: Online Users

```
# Mark a user as online
SADD onlineUsers alice@email.com

# Get all online users
SMEMBERS onlineUsers

# Check if a specific user is online
SISMEMBER onlineUsers alice@email.com

# Mark a user as offline
SREM onlineUsers alice@email.com

# Clear all online users
DEL onlineUsers
```

#### Feature 3: Friend Requests

```
# Send a friend request from bob to alice
RPUSH friendRequests:alice@email.com bob@email.com

# View all pending requests for alice
LRANGE friendRequests:alice@email.com 0 -1

# Check how many pending requests alice has
LLEN friendRequests:alice@email.com

# Remove bob's request from alice's inbox
LREM friendRequests:alice@email.com 1 bob@email.com

# Clear alice's entire inbox
DEL friendRequests:alice@email.com
```

## Video Demo

Here is the video demo of the entire project with a voice-over:

https://youtu.be/f_YZ0rQWe6Q