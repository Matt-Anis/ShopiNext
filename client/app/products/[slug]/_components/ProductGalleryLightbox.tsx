"use client";

import * as React from "react";
import Image from "next/image";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";

const LENS_SIZE = 200;
const ZOOM_MIN = 600;
const ZOOM_MAX = 1000;
const ZOOM_STEP = 100;

type GalleryImage = {
  id: string;
  url: string;
  altText: string | null;
};

export default function ProductGalleryLightbox({
  images,
  productName,
  startIndex,
  open,
  onOpenChange,
}: {
  images: GalleryImage[];
  productName: string;
  startIndex: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [isHovering, setIsHovering] = React.useState(false);
  const [lensPosition, setLensPosition] = React.useState({ x: 0, y: 0 });
  const [backgroundPosition, setBackgroundPosition] = React.useState("50% 50%");
  const [zoomSize, setZoomSize] = React.useState(ZOOM_MIN);
  const [zoomDirection, setZoomDirection] = React.useState<1 | -1>(1);
  const [api, setApi] = React.useState<CarouselApi>();

  const resetZoom = React.useCallback(() => {
    setZoomSize(ZOOM_MIN);
    setZoomDirection(1);
  }, []);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) resetZoom();
    onOpenChange(nextOpen);
  };

  React.useEffect(() => {
    if (!api) return;
    const handleSelect = () => {
      resetZoom();
      setIsHovering(false);
    };
    api.on("select", handleSelect);
    return () => {
      api.off("select", handleSelect);
    };
  }, [api, resetZoom]);

  const handleZoomClick = () => {
    setZoomSize((prev) => {
      const next = prev + zoomDirection * ZOOM_STEP;
      if (next >= ZOOM_MAX) {
        setZoomDirection(-1);
        return ZOOM_MAX;
      }
      if (next <= ZOOM_MIN) {
        setZoomDirection(1);
        return ZOOM_MIN;
      }
      return next;
    });
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const imageElement = event.currentTarget.querySelector("img");
    if (
      !imageElement ||
      !imageElement.naturalWidth ||
      !imageElement.naturalHeight
    ) {
      return;
    }

    const box = imageElement.getBoundingClientRect();
    const { naturalWidth, naturalHeight } = imageElement;

    // The <img> box fills the whole CarouselItem (Next's `fill`), but
    // object-contain letterboxes the actual photo inside it — recover
    // that rendered rect so the lens tracks the photo, not the box.
    const scale = Math.min(
      box.width / naturalWidth,
      box.height / naturalHeight,
    );
    const renderedWidth = naturalWidth * scale;
    const renderedHeight = naturalHeight * scale;
    const offsetX = (box.width - renderedWidth) / 2;
    const offsetY = (box.height - renderedHeight) / 2;

    const x = event.clientX - box.left;
    const y = event.clientY - box.top;

    const isInsideImage =
      x >= offsetX &&
      x <= offsetX + renderedWidth &&
      y >= offsetY &&
      y <= offsetY + renderedHeight;

    if (!isInsideImage) {
      setIsHovering(false);
      return;
    }

    setIsHovering(true);
    setLensPosition({
      x: Math.max(LENS_SIZE / 2, Math.min(x, box.width - LENS_SIZE / 2)),
      y: Math.max(LENS_SIZE / 2, Math.min(y, box.height - LENS_SIZE / 2)),
    });
    setBackgroundPosition(
      `${((x - offsetX) / renderedWidth) * 100}% ${((y - offsetY) / renderedHeight) * 100}%`,
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="h-[90vh] max-w-[80vw] p-4 sm:max-w-[80vw]">
        <DialogTitle className="sr-only">{productName} images</DialogTitle>

        <Carousel
          opts={{ startIndex }}
          setApi={setApi}
          className="h-full [&>div]:h-full"
        >
          <CarouselContent className="h-full">
            {images.map((image, index) => (
              <CarouselItem
                key={image.id}
                className="relative h-full overflow-hidden rounded-md"
                onMouseLeave={() => setIsHovering(false)}
                onMouseMove={handleMouseMove}
                onClick={isHovering ? handleZoomClick : undefined}
              >
                <Image
                  src={image.url}
                  alt={image.altText ?? productName}
                  fill
                  sizes="80vw"
                  priority={index === startIndex}
                  className={`rounded-md object-contain overflow-hidden ${
                    zoomDirection === -1 ? "cursor-zoom-out" : "cursor-zoom-in"
                  }`}
                />

                {isHovering && (
                  <div
                    className="pointer-events-none absolute rounded-md border-2 border-background shadow-lg"
                    style={{
                      width: LENS_SIZE,
                      height: LENS_SIZE,
                      left: lensPosition.x - LENS_SIZE / 2,
                      top: lensPosition.y - LENS_SIZE / 2,
                      backgroundImage: `url(${image.url})`,
                      backgroundSize: `${zoomSize}% ${zoomSize}%`,
                      backgroundPosition,
                      backgroundRepeat: "no-repeat",
                    }}
                  />
                )}
              </CarouselItem>
            ))}
          </CarouselContent>
          {images.length > 1 && (
            <>
              <CarouselPrevious className="left-2" />
              <CarouselNext className="right-2" />
            </>
          )}
        </Carousel>
      </DialogContent>
    </Dialog>
  );
}
