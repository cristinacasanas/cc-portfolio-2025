/**
 * Requêtes GROQ centralisées et optimisées pour l'application
 */

/**
 * Obtenir tous les projets avec leurs catégories étendues (optimisé)
 */
export const getAllProjects = `*[_type == "projects"] | order(orderRank) {
  _id,
  title,
  slug,
  thumbnail,
  gallery[0...3], // Limite à 3 images pour réduire la bande passante
  description,
  categories,
  "expandedCategories": categories[]-> {
    _id,
    title,
    slug
  }
}`;

/**
 * Obtenir tous les projets filtrés par catégorie (optimisé)
 * @param categorySlug - Slug ou ID de la catégorie
 */
export const getProjectsByCategory = (categorySlug: string) => `
  *[_type == "projects" && references(*[_type == "categories" && (slug.current == "${categorySlug}" || _id == "${categorySlug}")]._id)] | order(orderRank){
    _id,
    title,
    slug,
    thumbnail,
    gallery[0...3], // Limite à 3 images pour réduire la bande passante
    description,
    categories,
    "expandedCategories": categories[]-> {
      _id,
      title,
      slug
    }
  }
`;

/**
 * Obtenir un projet spécifique par son slug ou ID (optimisé)
 * @param projectId - Slug ou ID du projet
 */
export const getProjectById = (projectId: string) => `
  *[_type == "projects" && (slug.current == "${projectId}" || _id == "${projectId}") | order(orderRank)]{
    _id,
    title,
    slug,
    thumbnail,
    gallery, // Toutes les images pour la vue détaillée
    description,
    categories,
    "expandedCategories": categories[]-> {
      _id,
      title,
      slug
    }
  }
`;

/**
 * Obtenir toutes les catégories (optimisé)
 */
export const getAllCategories = `*[_type == "categories"] | order(orderRank) {
  _id,
  title,
  slug,
  orderRank
}`;

/**
 * Obtenir tous les projets pour les thumbnails (ultra-optimisé)
 */
export const getAllProjectsThumbnails = `*[_type == "projects"] | order(orderRank) {
  _id,
  title,
  slug,
  thumbnail,
  categories,
  "expandedCategories": categories[]-> {
    _id,
    title,
    slug
  }
}`;

/**
 * Obtenir tous les projets simples (sans les catégories étendues)
 */
export const getAllProjectsSimple = `*[_type == "projects"] | order(orderRank) {
  _id,
  title,
  slug,
  thumbnail
}`;

/**
 * Obtenir tous les projets simples filtrés par catégorie
 * @param categorySlug - Slug ou ID de la catégorie
 */
export const getProjectsByCategorySimple = (categorySlug: string) => `
  *[_type == "projects" && references(*[_type == "categories" && (slug.current == "${categorySlug}" || _id == "${categorySlug}")]._id)] | order(orderRank) {
    _id,
    title,
    slug,
    thumbnail
  }
`;
