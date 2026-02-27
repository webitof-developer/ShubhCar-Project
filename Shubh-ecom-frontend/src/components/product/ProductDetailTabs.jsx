"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, List, MessageSquare } from 'lucide-react';

const VARIANT_STYLES = {
  classic: {
    tabsList:
      'w-full h-auto p-1 bg-slate-50/50 border border-slate-100 rounded-xl flex justify-start gap-2 overflow-x-auto whitespace-nowrap no-scrollbar scroll-smooth',
    trigger:
      'rounded-lg border border-transparent data-[state=active]:border-blue-200 data-[state=active]:bg-white data-[state=active]:text-slate-900 px-6 py-3 text-sm font-bold tracking-wide uppercase transition-all hover:text-slate-900 hover:bg-white/50 bg-transparent text-slate-500 gap-2 flex-none shadow-none data-[state=active]:shadow-none',
    descContent:
      'mt-0 animate-in fade-in-50 duration-300 px-2',
    descText:
      'prose prose-slate max-w-none text-slate-600 leading-relaxed',
    specsContent:
      'mt-0 animate-in fade-in-50 duration-300',
    specsWrap:
      'rounded-xl border border-slate-100 overflow-hidden',
    table:
      'w-full text-sm text-left',
    tableHead:
      'bg-slate-50/50',
    headCellLeft:
      'px-6 py-4 font-semibold text-slate-900 w-1/3 border-b border-slate-100',
    headCellRight:
      'px-8 py-4 font-semibold text-slate-900 border-b border-slate-100',
    body:
      'divide-y divide-slate-50',
    row:
      'hover:bg-blue-50/30 border-slate-50 transition-colors',
    labelCell:
      'px-6 py-4 font-medium text-slate-500 bg-slate-50/30',
    valueCell:
      'px-8 py-4 font-semibold text-slate-700',
    emptyCell:
      'px-6 py-8 text-center text-slate-400 bg-slate-50/30',
    reviewsContent:
      'mt-0 animate-in fade-in-50 duration-300',
    showHeader: true,
  },
  v2: {
    tabsList:
      'h-auto p-1 bg-muted/40 border border-border/30 rounded-xl flex justify-start gap-1 overflow-x-auto whitespace-nowrap no-scrollbar mb-6 w-full',
    trigger:
      'rounded-lg px-5 py-2.5 text-sm font-semibold gap-1.5 flex-none data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary text-muted-foreground',
    descContent:
      'mt-0 animate-in fade-in-50 duration-300 px-1',
    descText:
      'prose prose-slate max-w-none text-muted-foreground leading-relaxed text-sm',
    specsContent:
      'mt-0 animate-in fade-in-50 duration-300',
    specsWrap:
      'rounded-xl border border-border/50 overflow-hidden',
    table:
      'w-full text-sm text-left',
    body:
      'divide-y divide-border/30',
    row:
      'hover:bg-muted/30 transition-colors',
    labelCell:
      'px-5 py-3 font-medium text-muted-foreground bg-muted/20 w-1/3',
    valueCell:
      'px-5 py-3 font-semibold text-foreground',
    emptyCell:
      'px-5 py-10 text-center text-muted-foreground',
    reviewsContent:
      'mt-0 animate-in fade-in-50 duration-300',
    showHeader: false,
  },
};

export const ProductDetailTabs = ({
  variant = 'classic',
  reviewsCount = 0,
  specs = [],
  description,
  reviewsContent,
}) => {
  const s = VARIANT_STYLES[variant] || VARIANT_STYLES.classic;

  return (
    <Tabs defaultValue="desc" className="w-full">
      <div className={variant === 'classic' ? 'mb-8' : undefined}>
        <TabsList className={s.tabsList}>
          <TabsTrigger value="desc" className={s.trigger}>
            <FileText className="w-4 h-4 opacity-70" /> Description
          </TabsTrigger>
          <TabsTrigger value="specs" className={s.trigger}>
            <List className="w-4 h-4 opacity-70" /> Specifications
          </TabsTrigger>
          <TabsTrigger value="reviews" className={s.trigger}>
            <MessageSquare className="w-4 h-4 opacity-70" /> Reviews ({reviewsCount})
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="desc" className={s.descContent}>
        <div className={s.descText}>
          {description || (
            <p className={variant === 'classic' ? 'text-slate-400 italic' : 'text-muted-foreground/60 italic'}>
              No detailed description available.
            </p>
          )}
        </div>
      </TabsContent>

      <TabsContent value="specs" className={s.specsContent}>
        <div className={s.specsWrap}>
          <table className={s.table}>
            {s.showHeader && (
              <thead className={s.tableHead}>
                <tr>
                  <th className={s.headCellLeft}>Specification</th>
                  <th className={s.headCellRight}>Details</th>
                </tr>
              </thead>
            )}
            <tbody className={s.body}>
              {specs.map((spec) => (
                <tr key={spec.label} className={s.row}>
                  <td className={s.labelCell}>{spec.label}</td>
                  <td className={s.valueCell}>{spec.value}</td>
                </tr>
              ))}
              {specs.length === 0 && (
                <tr>
                  <td colSpan={2} className={s.emptyCell}>
                    No specifications listed.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </TabsContent>

      <TabsContent value="reviews" className={s.reviewsContent}>
        {reviewsContent}
      </TabsContent>
    </Tabs>
  );
};
