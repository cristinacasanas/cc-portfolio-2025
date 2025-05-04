#!/usr/bin/env ts-node

import { createClient, type SanityClient } from '@sanity/client';
import { faker } from '@faker-js/faker';
import slugify from 'slugify';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Import Sanity types
import type { Category, Project } from './studio/sanity.types';

// Load environment variables from .env file
dotenv.config();

// Create Sanity client
const client: SanityClient = createClient({
  projectId: process.env.SANITY_PROJECT_ID || 'xozw2ash',
  dataset: process.env.SANITY_DATASET || 'staging',
  apiVersion: process.env.SANITY_API_VERSION || '2023-05-03',
  token: process.env.SANITY_TOKEN, // You need a token with write permissions
  useCdn: false,
});

// Configuration
const NUM_CATEGORIES = 5;
const NUM_PROJECTS = 10;
const IMAGE_WIDTH = 1200;
const IMAGE_HEIGHT = 800;
const THUMBNAIL_WIDTH = 600;
const THUMBNAIL_HEIGHT = 400;

// Helper function to create a delay
const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to upload an image to Sanity
async function uploadImage(width: number, height: number, alt = 'Image'): Promise<any> {
  // Generate a random image URL from picsum
  const imageUrl = `https://picsum.photos/${width}/${height}?random=${Math.random()}`;
  
  try {
    // Download the image
    const response = await fetch(imageUrl);
    const buffer = await response.arrayBuffer();
    
    // Upload to Sanity
    const asset = await client.assets.upload('image', Buffer.from(buffer), {
      filename: `${faker.helpers.slugify(alt)}-${Date.now()}.jpg`,
      contentType: 'image/jpeg',
    });
    
    return {
      _type: 'image',
      asset: {
        _type: 'reference',
        _ref: asset._id,
      },
      alt,
    };
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
}

// Create categories
async function createCategories(): Promise<any[]> {
  console.log('Creating categories...');
  const categories: any[] = [];
  
  for (let i = 0; i < NUM_CATEGORIES; i++) {
    const titleFr = faker.commerce.department();
    const titleEn = faker.commerce.department();
    
    const category = {
      _type: 'category',
      title: {
        fr: titleFr,
        en: titleEn,
      },
      slug: {
        _type: 'slug',
        current: slugify(titleFr, { lower: true }),
      },
    };
    
    try {
      const createdCategory = await client.create(category);
      categories.push(createdCategory);
      console.log(`Created category: ${titleFr}`);
      await delay(500); // Add a small delay between category creation
    } catch (error) {
      console.error(`Error creating category ${titleFr}:`, error);
    }
  }
  
  return categories;
}

// Create a project
async function createProject(categories: any[]): Promise<any> {
  const title = faker.commerce.productName();
  const slug = slugify(title, { lower: true });
  
  // Generate description in French and English
  const descriptionFr = faker.lorem.paragraphs(3);
  const descriptionEn = faker.lorem.paragraphs(3);
  
  // Upload thumbnail and cover image
  console.log(`Uploading images for project: ${title}...`);
  const thumbnail = await uploadImage(THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT, `Thumbnail for ${title}`);
  const coverImage = await uploadImage(IMAGE_WIDTH, IMAGE_HEIGHT, `Cover for ${title}`);
  
  // Create gallery with 3-6 images
  const gallerySize = faker.number.int({ min: 3, max: 6 });
  const gallery = [];
  
  for (let i = 0; i < gallerySize; i++) {
    const alt = `Gallery image ${i + 1} for ${title}`;
    const caption = faker.lorem.sentence();
    const image = await uploadImage(IMAGE_WIDTH, IMAGE_HEIGHT, alt);
    image.alt = alt;
    image.caption = caption;
    image._key = `gallery${i}`; // Add a unique key for array items
    gallery.push(image);
    await delay(300); // Add a small delay between image uploads
  }
  
  // Assign 1-3 random categories
  const numCategories = faker.number.int({ min: 1, max: 3 });
  const projectCategories = faker.helpers.arrayElements(categories, numCategories)
    .map(category => ({
      _type: 'reference',
      _ref: category._id,
      _key: faker.string.uuid(),
    }));
  
  // Create project object
  const project = {
    _type: 'project',
    title,
    slug: {
      _type: 'slug',
      current: slug,
    },
    thumbnail,
    coverImage,
    description: {
      fr: descriptionFr,
      en: descriptionEn,
    },
    gallery,
    categories: projectCategories,
    publishedAt: faker.date.past({ years: 2 }).toISOString(),
  };
  
  return project;
}

// Main function
async function seedData(): Promise<void> {
  try {
    console.log('Starting seed process...');
    
    // Create categories first
    const categories = await createCategories();
    if (categories.length === 0) {
      throw new Error('Failed to create categories');
    }
    
    console.log(`Created ${categories.length} categories`);
    console.log('Creating projects...');
    
    // Create projects
    for (let i = 0; i < NUM_PROJECTS; i++) {
      try {
        const project = await createProject(categories);
        const createdProject = await client.create(project);
        console.log(`Created project ${i + 1}/${NUM_PROJECTS}: ${project.title}`);
        await delay(1000); // Add a delay between project creation
      } catch (error) {
        console.error(`Error creating project ${i + 1}:`, error);
      }
    }
    
    console.log('Seed process completed successfully!');
  } catch (error) {
    console.error('Seed process failed:', error);
  }
}

// Run the seed function
seedData(); 