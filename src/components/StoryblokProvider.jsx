"use client";
import { getStoryblokApi } from "../../lib/storyblok/client";

export default function StoryblokProvider({ children }) {
    getStoryblokApi();
    return children;
}