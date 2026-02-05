// src/components/category/CategorySidebar.jsx

"use client";
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ChevronRight, FolderOpen, Folder } from 'lucide-react';
import { getCategories } from '@/services/categoryService';
import { useState, useEffect } from 'react';

export const CategorySidebar = () => {
  const { slug } = useParams();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Track which categories are expanded
  const [expandedCategories, setExpandedCategories] = useState(new Set());

  // Fetch full hierarchy on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoading(true);
        const hierarchy = await getCategories();
        setCategories(Array.isArray(hierarchy) ? hierarchy : []);
      } catch (error) {
        console.error("Failed to load categories:", error);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };
    loadCategories();
  }, []);

  // Handle auto-expansion based on current slug
  useEffect(() => {
    if (!slug || categories.length === 0) return;

    const findPathToSlug = (cats, targetSlug, path = []) => {
      for (const cat of cats) {
        if (cat.slug === targetSlug) return [...path, cat.id];
        if (cat.children?.length) {
          const found = findPathToSlug(cat.children, targetSlug, [...path, cat.id]);
          if (found) return found;
        }
      }
      return null;
    };

    const pathToCheck = findPathToSlug(categories, slug);
    if (pathToCheck) {
      setExpandedCategories(prev => {
        const next = new Set(prev);
        pathToCheck.forEach(id => next.add(id));
        return next;
      });
    }
  }, [slug, categories]);

  const toggleCategory = (categoryId, e) => {
    e.preventDefault();
    e.stopPropagation();

    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const isActive = (categorySlug) => slug === categorySlug;

  const renderCategory = (category, level = 0) => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedCategories.has(category.id || category._id);
    const active = isActive(category.slug);
    const indentClass = level === 0 ? '' : 'ml-4 border-l-2 border-border/30 pl-2';

    return (
      <div key={category.id || category._id} className={`mb-1 ${indentClass}`}>
        <div className="relative">
          <Link
            href={`/categories/${category.slug}`}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all group ${active
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-secondary/50 text-foreground'
              }`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${active
                ? 'bg-primary-foreground/20'
                : 'bg-primary/10 group-hover:bg-primary/20'
              }`}>
              {hasChildren ? (
                <FolderOpen className={`w-4 h-4 ${active ? 'text-primary-foreground' : 'text-primary'
                  }`} />
              ) : (
                <Folder className={`w-4 h-4 ${active ? 'text-primary-foreground' : 'text-primary'
                  }`} />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm truncate">
                {category.name}
              </div>
              {category.productCount > 0 && (
                <span className={`text-xs truncate ${active ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                  {category.productCount} parts
                </span>
              )}
            </div>

            {hasChildren && (
              <button
                onClick={(e) => toggleCategory(category.id || category._id, e)}
                className={`p-1 rounded hover:bg-background/10 transition-transform ${isExpanded ? 'rotate-90' : ''
                  }`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </Link>
        </div>

        {hasChildren && isExpanded && (
          <div className="mt-1 space-y-0.5">
            {category.children.map((child) => renderCategory(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) return <div className="p-4 text-center text-sm text-muted-foreground">Loading categories...</div>;

  return (
    <aside className="w-64 shrink-0">
      <div className="sticky top-20">
        <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
          <div className="bg-secondary/30 px-4 py-3 border-b border-border/50">
            <h3 className="font-semibold text-foreground">Categories</h3>
          </div>
          <div className="p-2 max-h-[calc(100vh-120px)] overflow-y-auto">
            {categories.map((category) => renderCategory(category, 0))}
          </div>
        </div>
      </div>
    </aside>
  );
};
