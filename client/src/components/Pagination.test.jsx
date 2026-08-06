import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Pagination from "./Pagination";

describe("Pagination", () => {
  it("renders nothing when there is only one page", () => {
    const { container } = render(
      <Pagination currentPage={1} totalPages={1} onPageChange={() => {}} />
    );

    expect(container.firstChild).toBeNull();
  });

  it("calls onPageChange with the previous page", () => {
    const onPageChange = vi.fn();
    render(<Pagination currentPage={3} totalPages={5} onPageChange={onPageChange} />);

    fireEvent.click(screen.getByText("Previous"));

    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it("calls onPageChange with the next page", () => {
    const onPageChange = vi.fn();
    render(<Pagination currentPage={2} totalPages={4} onPageChange={onPageChange} />);

    fireEvent.click(screen.getByText("Next"));

    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it("disables previous on the first page", () => {
    render(<Pagination currentPage={1} totalPages={4} onPageChange={() => {}} />);

    expect(screen.getByText("Previous")).toBeDisabled();
  });

  it("disables next on the last page", () => {
    render(<Pagination currentPage={4} totalPages={4} onPageChange={() => {}} />);

    expect(screen.getByText("Next")).toBeDisabled();
  });
});
