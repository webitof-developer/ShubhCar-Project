import Link from 'next/link';
import Image from 'next/image';
import { FolderOpen } from 'lucide-react';

export const SubCategoryGrid = ({ categories }) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
    {categories.map((sub, i) => (
      <Link
        key={sub._id || sub.id || i}
        href={`/categories/${sub.slug}`}
        className="group flex flex-col items-center bg-card rounded-xl border border-border/50 hover:border-primary/40 hover:shadow-md transition-all p-4 text-center"
      >
        <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
          {sub.image
            ? <Image src={sub.image} alt={sub.name} width={40} height={40} className="object-contain" />
            : <FolderOpen className="w-7 h-7 text-primary" />
          }
        </div>
        <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug mb-1">
          {sub.name}
        </h3>
        {sub.productCount > 0 && (
          <span className="text-xs text-muted-foreground">{sub.productCount} parts</span>
        )}
      </Link>
    ))}
  </div>
);
