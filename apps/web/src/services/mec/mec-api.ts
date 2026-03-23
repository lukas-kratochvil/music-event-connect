import axios from "axios";
import { getConfig } from "@/config/config";

/**
 * Music-Event-Connect API instance
 */
export const mecApi = axios.create({
  baseURL: getConfig().musicEventConnect.apiUrl,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});
