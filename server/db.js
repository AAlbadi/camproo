import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.resolve(__dirname, "./data/camproo.json");

let database = null;
let saveQueue = Promise.resolve();

function loadDatabase() {
  if (database) return database;
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, "utf8");
      database = JSON.parse(raw);
    } else {
      database = {
        users: [],
        spots: [],
        requests: [],
        threads: [],
        posts: [],
        reviews: [],
        reports: [],
        updatedAt: new Date().toISOString(),
      };
    }
  } catch (err) {
    console.error("Error loading database file, initializing empty db:", err);
    database = {
      users: [],
      spots: [],
      requests: [],
      threads: [],
      posts: [],
      reviews: [],
      reports: [],
      updatedAt: new Date().toISOString(),
    };
  }
  return database;
}

function queueSave() {
  saveQueue = saveQueue.then(async () => {
    try {
      database.updatedAt = new Date().toISOString();
      const tempPath = `${DATA_FILE}.tmp.${Date.now()}`;
      await fs.promises.writeFile(tempPath, JSON.stringify(database, null, 2), "utf8");
      await fs.promises.rename(tempPath, DATA_FILE);
    } catch (err) {
      console.error("Error persisting database:", err);
    }
  });
  return saveQueue;
}

export const db = {
  getUsers: () => {
    const data = loadDatabase();
    return data.users;
  },
  getUserById: (id) => {
    const data = loadDatabase();
    return data.users.find(u => u.id === id) || null;
  },
  addUser: (userData) => {
    const data = loadDatabase();
    const newUser = {
      id: userData.id || `user-${Date.now()}`,
      joinedDate: userData.joinedDate || new Date().toISOString().split("T")[0],
      memberNumber: userData.memberNumber || Math.floor(1000 + Math.random() * 9000),
      ...userData,
    };
    data.users.push(newUser);
    queueSave();
    return newUser;
  },
  updateUser: (id, updates) => {
    const data = loadDatabase();
    const idx = data.users.findIndex(u => u.id === id);
    if (idx === -1) return null;
    data.users[idx] = { ...data.users[idx], ...updates };
    queueSave();
    return data.users[idx];
  },

  getSpots: (filters = {}) => {
    const data = loadDatabase();
    let result = [...data.spots];

    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(s =>
        s.title.toLowerCase().includes(q) ||
        s.locationName.toLowerCase().includes(q) ||
        s.generalArea.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q)
      );
    }
    if (filters.environment && filters.environment !== "all") {
      result = result.filter(s => s.environment === filters.environment);
    }
    if (filters.minLength) {
      const minL = Number(filters.minLength);
      result = result.filter(s => s.rigCompatibility.maxLengthFt >= minL);
    }
    if (filters.electricity && filters.electricity !== "all") {
      result = result.filter(s => s.hookups.electricity === filters.electricity);
    }
    if (filters.water && filters.water !== "all") {
      result = result.filter(s => s.hookups.water !== "none");
    }
    if (filters.pets === "true") {
      result = result.filter(s => s.hookups.petsAllowed);
    }

    return result;
  },
  getSpotById: (id) => {
    const data = loadDatabase();
    return data.spots.find(s => s.id === id) || null;
  },
  addSpot: (spotData) => {
    const data = loadDatabase();
    const newSpot = {
      id: spotData.id || `spot-${Date.now()}`,
      rating: spotData.rating || 5.0,
      reviewCount: spotData.reviewCount || 0,
      activeStatus: spotData.activeStatus || "live",
      photos: spotData.photos && spotData.photos.length > 0 ? spotData.photos : ["/images/hero_rv_camp.jpg"],
      ...spotData,
    };
    data.spots.unshift(newSpot);
    queueSave();
    return newSpot;
  },
  updateSpot: (id, updates) => {
    const data = loadDatabase();
    const idx = data.spots.findIndex(s => s.id === id);
    if (idx === -1) return null;
    data.spots[idx] = { ...data.spots[idx], ...updates };
    queueSave();
    return data.spots[idx];
  },
  deleteSpot: (id) => {
    const data = loadDatabase();
    const idx = data.spots.findIndex(s => s.id === id);
    if (idx === -1) return false;
    data.spots.splice(idx, 1);
    queueSave();
    return true;
  },

  getRequests: (query = {}) => {
    const data = loadDatabase();
    let list = [...data.requests];
    if (query.travelerId) {
      list = list.filter(r => r.travelerId === query.travelerId);
    }
    if (query.hostId) {
      list = list.filter(r => r.hostId === query.hostId);
    }
    return list;
  },
  getRequestById: (id) => {
    const data = loadDatabase();
    return data.requests.find(r => r.id === id) || null;
  },
  addRequest: (reqData) => {
    const data = loadDatabase();
    const newReq = {
      id: reqData.id || `req-${Date.now()}`,
      status: "pending",
      createdAt: new Date().toISOString(),
      ...reqData,
    };
    data.requests.unshift(newReq);
    queueSave();
    return newReq;
  },
  updateRequest: (id, updates) => {
    const data = loadDatabase();
    const idx = data.requests.findIndex(r => r.id === id);
    if (idx === -1) return null;
    data.requests[idx] = { ...data.requests[idx], ...updates };
    queueSave();
    return data.requests[idx];
  },

  getThreads: (userId) => {
    const data = loadDatabase();
    if (!userId) return data.threads;
    return data.threads.filter(t => t.participantIds.includes(userId));
  },
  getThreadById: (id) => {
    const data = loadDatabase();
    return data.threads.find(t => t.id === id) || null;
  },
  addThread: (threadData) => {
    const data = loadDatabase();
    const newThread = {
      id: threadData.id || `thread-${Date.now()}`,
      messages: threadData.messages || [],
      lastMessageAt: new Date().toISOString(),
      unreadBy: threadData.unreadBy || [],
      ...threadData,
    };
    data.threads.unshift(newThread);
    queueSave();
    return newThread;
  },
  addMessageToThread: (threadId, msgData) => {
    const data = loadDatabase();
    const thread = data.threads.find(t => t.id === threadId);
    if (!thread) return null;

    const newMsg = {
      id: msgData.id || `msg-${Date.now()}`,
      createdAt: new Date().toISOString(),
      ...msgData,
    };
    thread.messages.push(newMsg);
    thread.lastMessageAt = newMsg.createdAt;
    thread.unreadBy = thread.participantIds.filter(p => p !== msgData.senderId);
    queueSave();
    return newMsg;
  },
  markThreadRead: (threadId, userId) => {
    const data = loadDatabase();
    const thread = data.threads.find(t => t.id === threadId);
    if (!thread) return false;
    thread.unreadBy = thread.unreadBy.filter(u => u !== userId);
    queueSave();
    return true;
  },

  getPosts: (category) => {
    const data = loadDatabase();
    if (!category || category === "all") return data.posts;
    return data.posts.filter(p => p.category === category);
  },
  addPost: (postData) => {
    const data = loadDatabase();
    const newPost = {
      id: postData.id || `post-${Date.now()}`,
      upvotes: 0,
      upvotedBy: [],
      comments: [],
      createdAt: "Just now",
      ...postData,
    };
    data.posts.unshift(newPost);
    queueSave();
    return newPost;
  },
  upvotePost: (id, userId) => {
    const data = loadDatabase();
    const post = data.posts.find(p => p.id === id);
    if (!post) return null;

    if (!post.upvotedBy) post.upvotedBy = [];
    const hasUpvoted = post.upvotedBy.includes(userId);
    if (hasUpvoted) {
      post.upvotedBy = post.upvotedBy.filter(u => u !== userId);
      post.upvotes = Math.max(0, post.upvotes - 1);
    } else {
      post.upvotedBy.push(userId);
      post.upvotes += 1;
    }
    queueSave();
    return post;
  },
  addCommentToPost: (postId, commentData) => {
    const data = loadDatabase();
    const post = data.posts.find(p => p.id === postId);
    if (!post) return null;

    const newComment = {
      id: commentData.id || `comment-${Date.now()}`,
      createdAt: "Just now",
      ...commentData,
    };
    if (!post.comments) post.comments = [];
    post.comments.push(newComment);
    queueSave();
    return newComment;
  },

  getReviews: (spotId) => {
    const data = loadDatabase();
    if (!spotId) return data.reviews;
    return data.reviews.filter(r => r.spotId === spotId);
  },
  addReview: (reviewData) => {
    const data = loadDatabase();
    const newReview = {
      id: reviewData.id || `rev-${Date.now()}`,
      createdAt: "Just now",
      ...reviewData,
    };
    data.reviews.unshift(newReview);

    const spot = data.spots.find(s => s.id === reviewData.spotId);
    if (spot) {
      const spotRevs = data.reviews.filter(r => r.spotId === spot.id);
      const avg = spotRevs.reduce((acc, r) => acc + r.rating, 0) / spotRevs.length;
      spot.rating = parseFloat(avg.toFixed(2));
      spot.reviewCount = spotRevs.length;
    }
    queueSave();
    return newReview;
  },

  getReports: () => {
    const data = loadDatabase();
    return data.reports;
  },
  addReport: (reportData) => {
    const data = loadDatabase();
    const newReport = {
      id: reportData.id || `report-${Date.now()}`,
      status: "pending",
      createdAt: new Date().toISOString(),
      ...reportData,
    };
    data.reports.unshift(newReport);
    queueSave();
    return newReport;
  },
  updateReport: (id, updates) => {
    const data = loadDatabase();
    const idx = data.reports.findIndex(r => r.id === id);
    if (idx === -1) return null;
    data.reports[idx] = { ...data.reports[idx], ...updates };
    queueSave();
    return data.reports[idx];
  },
  getEmailLogs: () => {
    return [
      { id: 'em-1', to: 'alex.sam@roamlife.com', subject: 'Welcome to CampRoo USA', status: 'delivered', timestamp: new Date().toISOString() },
      { id: 'em-2', to: 'caleb.sarah@redrockmoab.com', subject: 'New Free RV Stay Request', status: 'delivered', timestamp: new Date().toISOString() },
      { id: 'em-3', to: 'elena.v@pnwvanlife.org', subject: 'CampRoo Roam Hub Discussion Alert', status: 'delivered', timestamp: new Date().toISOString() },
    ];
  },
};