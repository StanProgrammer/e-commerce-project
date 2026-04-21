const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const pages = [];

  if (currentPage > 1) {
    pages.push(currentPage - 1);
  }

  pages.push(currentPage);

  if (currentPage < totalPages) {
    pages.push(currentPage + 1);
  }

  return (
    <div className="mt-8 flex justify-center items-center gap-2">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-4 py-2 bg-gray-200 rounded-md disabled:opacity-50"
      >
        Previous
      </button>

      {pages.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`px-4 py-2 rounded-md cursor-pointer ${
            page === currentPage
              ? "bg-primary text-white"
              : "bg-gray-200 hover:bg-gray-300"
          }`}
        >
          {page}
        </button>
      ))}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-4 py-2 bg-gray-200 rounded-md disabled:opacity-50"
      >
        Next
      </button>
    </div>
  );
};

export default Pagination;
