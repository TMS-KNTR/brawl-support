type Props = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export default function Pagination({ page, totalPages, onPageChange }: Props) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 py-4">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="px-3 py-1.5 text-[12px] font-semibold rounded-md border border-[#E5E5E5] hover:bg-[#F5F5F5] transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
      >
        前へ
      </button>
      <span className="text-[12px] text-[#666] px-2">
        {page} / {totalPages}
      </span>
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="px-3 py-1.5 text-[12px] font-semibold rounded-md border border-[#E5E5E5] hover:bg-[#F5F5F5] transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
      >
        次へ
      </button>
    </div>
  );
}
