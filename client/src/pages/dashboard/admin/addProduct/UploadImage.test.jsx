import { describe, it, expect, vi, beforeEach } from "vitest";
import { useState } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import UploadImage from "./UploadImage";

// jsdom does not implement blob object URLs; stub them so file selection works.
// The URL is derived from the file name so preview keys stay unique.
beforeEach(() => {
  URL.createObjectURL = vi.fn((file) => `blob:${file.name}`);
  URL.revokeObjectURL = vi.fn();
});

const makeFile = (name, type = "image/jpeg") =>
  new File(["fake-image"], name, { type });

const selectFiles = (files) => {
  const input = screen.getByLabelText(/Click to upload/);
  fireEvent.change(input, { target: { files } });
};

const getRemoveButtons = () => screen.getAllByRole("button", { name: "✕" });

// Mirrors how UpdateProduct owns `images` (new files) and `existingImages`
// (backend URLs) state and hands them to UploadImage.
const Harness = ({ initialExisting = [], onRemoveExisting }) => {
  const [images, setImages] = useState([]);
  const [existingImages, setExistingImages] = useState(initialExisting);

  return (
    <div>
      <UploadImage
        label="Images"
        setImage={setImages}
        existingImages={existingImages}
        onRemoveExisting={(url) => {
          setExistingImages((prev) => prev.filter((u) => u !== url));
          onRemoveExisting?.(url);
        }}
      />
      <span data-testid="new-files">{images.map((f) => f.name).join(",")}</span>
      <span data-testid="existing-count">{existingImages.length}</span>
    </div>
  );
};

describe("UploadImage", () => {
  it("renders existing images from the backend", () => {
    render(<Harness initialExisting={["https://cdn.example/a.jpg", "https://cdn.example/b.jpg"]} />);

    const previews = screen.getAllByAltText("preview");
    expect(previews).toHaveLength(2);
    expect(previews[0]).toHaveAttribute("src", "https://cdn.example/a.jpg");
    expect(previews[1]).toHaveAttribute("src", "https://cdn.example/b.jpg");
    expect(screen.getByTestId("existing-count").textContent).toBe("2");
  });

  it("adds newly selected files to the parent image state", () => {
    render(<Harness />);

    selectFiles([makeFile("one.jpg"), makeFile("two.png", "image/png")]);

    expect(screen.getByTestId("new-files").textContent).toBe("one.jpg,two.png");
    expect(screen.getAllByAltText("preview")).toHaveLength(2);
  });

  it("removing a NEW image removes only that file, even when existing images are present", () => {
    render(<Harness initialExisting={["https://cdn.example/a.jpg", "https://cdn.example/b.jpg"]} />);

    selectFiles([makeFile("new.jpg")]);
    expect(screen.getAllByAltText("preview")).toHaveLength(3);

    // Remove buttons: index 0, 1 are existing images; index 2 is the new one.
    fireEvent.click(getRemoveButtons()[2]);

    expect(screen.getByTestId("new-files").textContent).toBe("");
    expect(screen.getByTestId("existing-count").textContent).toBe("2");
    expect(screen.getAllByAltText("preview")).toHaveLength(2);
  });

  it("removing an EXISTING image drops it from the parent state and keeps new uploads", () => {
    const onRemoveExisting = vi.fn();
    render(
      <Harness
        initialExisting={["https://cdn.example/a.jpg", "https://cdn.example/b.jpg"]}
        onRemoveExisting={onRemoveExisting}
      />
    );

    selectFiles([makeFile("new.jpg")]);
    expect(screen.getAllByAltText("preview")).toHaveLength(3);

    // Remove the first existing image.
    fireEvent.click(getRemoveButtons()[0]);

    expect(onRemoveExisting).toHaveBeenCalledWith("https://cdn.example/a.jpg");
    expect(screen.getByTestId("existing-count").textContent).toBe("1");
    // The new upload survives.
    expect(screen.getByTestId("new-files").textContent).toBe("new.jpg");
    expect(screen.getAllByAltText("preview")).toHaveLength(2);
  });

  it("removing the LAST existing image still keeps new uploads and shows the upload box", () => {
    render(<Harness initialExisting={["https://cdn.example/a.jpg"]} />);

    selectFiles([makeFile("new.jpg")]);
    expect(screen.getAllByAltText("preview")).toHaveLength(2);

    fireEvent.click(getRemoveButtons()[0]);

    expect(screen.getByTestId("existing-count").textContent).toBe("0");
    expect(screen.getByTestId("new-files").textContent).toBe("new.jpg");
    expect(screen.getAllByAltText("preview")).toHaveLength(1);
  });

  it("enforces the 5-image limit across existing and new images", () => {
    render(
      <Harness
        initialExisting={[
          "https://cdn.example/a.jpg",
          "https://cdn.example/b.jpg",
          "https://cdn.example/c.jpg",
          "https://cdn.example/d.jpg",
        ]}
      />
    );

    // 4 existing + 2 new would exceed the limit; nothing may be added.
    selectFiles([makeFile("e.jpg"), makeFile("f.jpg")]);

    expect(screen.getByTestId("new-files").textContent).toBe("");
    expect(screen.getAllByAltText("preview")).toHaveLength(4);
  });
});
