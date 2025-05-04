import CONFIG from "../config";
import { showInAppNotification } from "../utils/in-app-notification";
import StoryModel from "../models/StoryModel";

const ENDPOINTS = {
  REGISTER: `${CONFIG.BASE_URL}/register`,
  LOGIN: `${CONFIG.BASE_URL}/login`,
  GET_STORIES: `${CONFIG.BASE_URL}/stories`,
  ADD_STORY: `${CONFIG.BASE_URL}/stories`,
  ADD_GUEST_STORY: `${CONFIG.BASE_URL}/stories/guest`,
  GET_STORY_DETAIL: (id) => `${CONFIG.BASE_URL}/stories/${id}`,
};

const TOKEN_KEY = "story_app_token";
const QUEUE_KEY = "offline_request_queue";

// Queue management
function getQueue() {
  const queue = localStorage.getItem(QUEUE_KEY);
  return queue ? JSON.parse(queue) : [];
}

function saveQueue(queue) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

function addToQueue(request) {
  const queue = getQueue();
  queue.push(request);
  saveQueue(queue);
}

async function processQueue() {
  if (!navigator.onLine) return;

  const queue = getQueue();
  if (queue.length === 0) return;

  const newQueue = [];

  for (const request of queue) {
    try {
      if (request.type === "addStory") {
        await addStory(request.data);
      } else if (request.type === "addGuestStory") {
        await addGuestStory(request.data);
      }
    } catch (error) {
      newQueue.push(request);
    }
  }

  saveQueue(newQueue);
}

// Listen for online status
if (typeof window !== "undefined") {
  window.addEventListener("online", processQueue);
}

// Create a single instance of StoryModel to be used throughout the app
const storyModel = new StoryModel();

// Export the model methods to keep compatibility with existing code
export const getToken = () => storyModel.getToken();
export const setToken = (token) => storyModel.setToken(token);
export const removeToken = () => storyModel.removeToken();
export const register = (data) => storyModel.register(data);
export const login = (data) => storyModel.login(data);
export const getStories = () => storyModel.getStories();
export const getStoryDetail = (id) => storyModel.getStoryDetail(id);
export const addStory = (data) => storyModel.addStory(data);
export const addGuestStory = (data) => storyModel.addGuestStory(data);
export const logout = () => storyModel.logout();

// Export the model instance itself
export default storyModel;
