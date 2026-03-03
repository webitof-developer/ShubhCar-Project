import Link from 'next/link';
import Image from 'next/image';
import { FolderOpen } from 'lucide-react';
import { resolveAssetUrl } from '@/utils/media';

export const SubCategoryGrid = ({ categories }) => (
  <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4'>
    {categories.map((sub, i) => {
      const categoryImage = sub.imageUrl || sub.image || null;
      const resolvedImage = categoryImage
        ? resolveAssetUrl(categoryImage)
        : null;
      return (
        <Link
          key={sub._id || sub.id || i}
          href={`/categories/${sub.slug}`}
          className='group relative flex flex-col items-center justify-center p-4 md:p-5 bg-white rounded-2xl shadow-sm border border-slate-100 hover:border-primary/20 hover:shadow-xl hover:-translate-y-1 transition-all duration-300'>
          <div className='relative mb-3 flex items-center justify-center w-14 h-14 md:w-16 md:h-16'>
            {resolvedImage ? (
              <Image
                src={resolvedImage}
                alt={sub.name}
                fill
                className='object-contain transition-transform duration-500 group-hover:scale-110'
                sizes='(max-width: 768px) 56px, 64px'
              />
            ) : (
              <div className='w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-primary/5 transition-colors duration-300'>
                <FolderOpen className='w-6 h-6 text-slate-400 group-hover:text-primary transition-colors duration-300' />
              </div>
            )}
          </div>
          <h3 className='text-sm font-bold text-slate-800 text-center leading-tight group-hover:text-primary transition-colors duration-300 line-clamp-2 mb-1'>
            {sub.name}
          </h3>
          {sub.productCount > 0 && (
            <span className='mt-1 px-2.5 py-0.5 rounded-full bg-slate-50 text-[10px] font-medium text-slate-500 border border-slate-100'>
              {sub.productCount} parts
            </span>
          )}
        </Link>
      );
    })}
  </div>
);
