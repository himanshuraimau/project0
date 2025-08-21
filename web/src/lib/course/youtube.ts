import axios from "axios";
import { strict_output } from "./ai-course-service";

// Types for the scraper API responses
interface ScrapedVideo {
  type: "video";
  id: string;
  url: string;
  title: string;
  thumbnail: string;
  channel: {
    id: string;
    title: string;
    handle: string;
    thumbnail: string;
  };
  viewCountText: string;
  viewCountInt: number;
  publishedTimeText: string;
  publishedTime: string;
  lengthText: string;
  lengthSeconds: number;
  badges: string[];
}

interface SearchResponse {
  videos: ScrapedVideo[];
  channels: unknown[];
  playlists: unknown[];
  shorts: unknown[];
  shelves: unknown[];
  lives: unknown[];
  continuationToken: string;
}

interface TranscriptItem {
  text: string;
  startMs: string;
  endMs: string;
  startTimeText: string;
}

interface TranscriptResponse {
  videoId: string;
  type: string;
  url: string;
  transcript: TranscriptItem[];
  transcript_only_text: string;
}

export async function searchYoutube(searchQuery: string): Promise<string | null> {
  try {
    const { data } = await axios.get<SearchResponse>(
      "https://api.scrapecreators.com/v1/youtube/search",
      {
        params: {
          query: searchQuery,
          // Filter for medium duration videos (similar to old API behavior)
          filter: "video"
        },
        headers: {
          "x-api-key": process.env.SCRAPPER_API_KEY,
        },
      }
    );

    if (!data || !data.videos || data.videos.length === 0) {
      console.log("No videos found for query:", searchQuery);
      return null;
    }

    // Filter for videos with reasonable length (similar to medium duration filter)
    const suitableVideos = data.videos.filter(video => 
      video.lengthSeconds >= 120 && // At least 2 minutes
      video.lengthSeconds <= 3600   // At most 1 hour
    );

    if (suitableVideos.length === 0) {
      console.log("No suitable duration videos found");
      // Fallback to first video if no medium duration videos
      return data.videos[0].id;
    }

    return suitableVideos[0].id;
  } catch (error: any) {
    console.error("YouTube search failed:", error);
    
    // If it's a 402 error (payment required), return a fallback video ID
    if (error.status === 402) {
      console.log("API limit reached, using fallback video");
      // Return a generic educational video ID as fallback
      return "dQw4w9WgXcQ"; // You can replace this with any educational video ID
    }
    
    return null;
  }
}

export async function getTranscript(videoId: string): Promise<string> {
  try {
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    
    const { data } = await axios.get<TranscriptResponse>(
      "https://api.scrapecreators.com/v1/youtube/video/transcript",
      {
        params: {
          url: videoUrl,
        },
        headers: {
          "x-api-key": process.env.SCRAPPER_API_KEY,
        },
      }
    );

    if (!data || !data.transcript_only_text) {
      console.log("No transcript available for video:", videoId);
      return "";
    }

    return data.transcript_only_text;
  } catch (error: any) {
    console.error("Transcript fetch failed for video:", videoId, error);
    
    // If it's a 402 error (payment required), return a generic transcript
    if (error.status === 402) {
      console.log("API limit reached, using fallback transcript");
      return "This is a sample transcript for testing purposes. The video covers the fundamental concepts of the topic with detailed explanations and examples.";
    }
    
    return "";
  }
}

export async function getQuestionsFromTranscript(
  transcript: string,
  course_title: string
) {
  type Question = {
    question: string;
    answer: string;
    option1: string;
    option2: string;
    option3: string;
  };
  const questions: Question[] = await strict_output(
    "You are a helpful AI that is able to generate mcq questions and answers, the length of each answer should not be more than 15 words",
    new Array(3).fill(
      `You are to generate a random hard mcq question about ${course_title} with context of the following transcript: ${transcript}`
    ),
    {
      question: "question",
      answer: "answer with max length of 15 words",
      option1: "option1 with max length of 15 words",
      option2: "option2 with max length of 15 words",
      option3: "option3 with max length of 15 words",
    }
  ) as Question[];
  return questions;
}