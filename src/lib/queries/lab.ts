import groq from "groq";

export const getLab = groq`*[_type == "lab"]{
  images[]{
    asset->{
      _id,
      url
    }
  }
}`;
