/**
 * Requêtes GROQ centralisées pour l'application
 */

/**
 * Obtenir tous les projets avec leurs catégories étendues
 */
export const getAllProjects = `*[_type == "projects"]{
  ...,
  "expandedCategories": categories[]->
}`;

/**
 * Obtenir tous les projets filtrés par catégorie
 * @param categorySlug - Slug ou ID de la catégorie
 */
export const getProjectsByCategory = (categorySlug: string) => `
  *[_type == "projects" && references(*[_type == "categories" && (slug.current == "${categorySlug}" || _id == "${categorySlug}")]._id)]{
    ...,
    "expandedCategories": categories[]->
  }
`;

/**
 * Obtenir un projet spécifique par son slug ou ID
 * @param projectId - Slug ou ID du projet
 */
export const getProjectById = (projectId: string) => `
  *[_type == "projects" && (slug.current == "${projectId}" || _id == "${projectId}")]{
    ...,
    "expandedCategories": categories[]->
  }
`;

/**
 * Obtenir toutes les catégories
 */
export const getAllCategories = `*[_type == "categories"] | order(orderRank)`;

/**
 * Obtenir tous les projets simples (sans les catégories étendues)
 */
export const getAllProjectsSimple = `*[_type == "projects"] | order(orderRank)`;

/**
 * Obtenir tous les projets simples filtrés par catégorie
 * @param categorySlug - Slug ou ID de la catégorie
 */
export const getProjectsByCategorySimple = (categorySlug: string) => `
  *[_type == "projects" && references(*[_type == "categories" && (slug.current == "${categorySlug}" || _id == "${categorySlug}")]._id)] | order(orderRank)
`;
