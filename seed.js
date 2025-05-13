#!/usr/bin/env ts-node

import { createClient} from '@sanity/client';
import { faker } from '@faker-js/faker';
import slugify from 'slugify';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables from .env file
dotenv.config();

// Create Sanity client
const client = createClient({
  projectId: process.env.VITE_SANITY_PROJECT_ID || '8gdwrje8',
  dataset: process.env.VITE_SANITY_DATASET || 'development',
  apiVersion: process.env.VITE_SANITY_API_VERSION || '2023-05-03',
  token: process.env.VITE_SANITY_TOKEN, 
  useCdn: false,
});

// Configuration
const NUM_CATEGORIES = 5;
const NUM_projectsS = 10;
const IMAGE_WIDTH = 1200;
const IMAGE_HEIGHT = 800;
const THUMBNAIL_WIDTH = 600;
const THUMBNAIL_HEIGHT = 400;

// Helper function to create a delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to upload an image to Sanity
async function uploadImage(width, height, alt = 'Image') {
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
async function createCategories() {
  console.log('Creating categories...');
  const categories = [];
  
  for (let i = 0; i < NUM_CATEGORIES; i++) {
    const titleFr = faker.commerce.department();
    const titleEn = faker.commerce.department();
    

    const category = {
      _type: 'categories',
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

// Create a projects
async function createprojects(categories) {
  const title = faker.commerce.productName();
  const slug = slugify(title, { lower: true });
  
  // Generate description in French and English
  const descriptionFr = faker.lorem.paragraphs(3);
  const descriptionEn = faker.lorem.paragraphs(3);
  
  // Upload thumbnail and cover image
  console.log(`Uploading images for projects: ${title}...`);
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
  const projectsCategories = faker.helpers.arrayElements(categories, numCategories)
    .map(category => ({
      _type: 'reference',
      _ref: category._id,
      _key: faker.string.uuid(),
    }));
  
  // Create projects object
  const projects = {
    _type: 'projects',
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
    categories: projectsCategories,
    publishedAt: faker.date.past({ years: 2 }).toISOString(),
  };
  
  return projects;
}

// Main function
async function seedData() {
  try {
    console.log('Starting seed process...');
    
    // Create categories first
    const categories = await createCategories();
    if (categories.length === 0) {
      throw new Error('Failed to create categories');
    }
    
    console.log(`Created ${categories.length} categories`);
    console.log('Creating projects...');
    
    // Create projectss
    for (let i = 0; i < NUM_projectsS; i++) {
      try {
        const projects = await createprojects(categories);
        const createdprojects = await client.create(projects);
        console.log(`Created projects ${i + 1}/${NUM_projectsS}: ${projects.title}`);
        await delay(1000); // Add a delay between projects creation
      } catch (error) {
        console.error(`Error creating projects ${i + 1}:`, error);
      }
    }
    
    console.log('Seed process completed successfully!');
  } catch (error) {
    console.error('Seed process failed:', error);
  }
}

// Run the seed function
seedData(); 