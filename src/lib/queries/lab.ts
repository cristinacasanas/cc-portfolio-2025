import groq from "groq";

// Requête optimisée pour le lab avec limitation du nombre d'images
export const getLab = groq`*[_type == "lab"]{
  images[0...20]{ // Limite à 20 images par entrée pour économiser la bande passante
    asset->{
      _id,
      url
    }
  }
}`;

// Requête pour le lab avec images de taille réduite
export const getLabOptimized = groq`*[_type == "lab"]{
  images[0...15]{ // Encore plus limité pour les vues mobile
    asset->{
      _id,
      url
    }
  }
}`;
