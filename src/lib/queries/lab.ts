import groq from "groq";

export const getLabImagesQuery = groq`*[_type == "lab"][0] {
  "images": images[] {
    asset->{
      _id,
      url,
      metadata {
        dimensions {
          width,
          height,
          aspectRatio
        }
      }
    }
  }
}`;
