#!/usr/bin/env python3
"""Convert images to optimized WebP or AVIF.

Usage:
  python optimize_images.py --input path/to/folder --output optimized --format webp --quality 80 --recursive

This script keeps originals by default and writes converted files to the output folder.
"""

import argparse
import os
from pathlib import Path
from PIL import Image, UnidentifiedImageError

SUPPORTED_INPUT = {'.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.tif', '.gif', '.webp'}
SUPPORTED_FORMATS = {'webp', 'avif'}


def parse_args():
    parser = argparse.ArgumentParser(description='Optimize images by converting to WebP or AVIF.')
    parser.add_argument('--input', '-i', type=str, default='.', help='Input file or directory')
    parser.add_argument('--output', '-o', type=str, default='optimized_images', help='Output directory')
    parser.add_argument('--format', '-f', type=str, default='webp', choices=SUPPORTED_FORMATS, help='Output image format')
    parser.add_argument('--quality', '-q', type=int, default=80, help='Output quality (0-100)')
    parser.add_argument('--max-size', type=str, default='', help='Max widthxheight, e.g. 1600x1200')
    parser.add_argument('--recursive', '-r', action='store_true', help='Scan folders recursively')
    parser.add_argument('--inplace', action='store_true', help='Overwrite original files instead of writing to output folder')
    parser.add_argument('--dry-run', action='store_true', help='Show what would be converted without writing files')
    return parser.parse_args()


def is_supported_image(path: Path):
    return path.suffix.lower() in SUPPORTED_INPUT


def parse_max_size(value: str):
    if not value:
        return None
    try:
        width, height = map(int, value.lower().split('x'))
        return width, height
    except ValueError:
        raise argparse.ArgumentTypeError('max-size must use WIDTHxHEIGHT format, e.g. 1600x900')


def collect_images(base: Path, recursive: bool):
    if base.is_file():
        return [base] if is_supported_image(base) else []
    if base.is_dir():
        if recursive:
            return [p for p in base.rglob('*') if p.is_file() and is_supported_image(p)]
        return [p for p in base.iterdir() if p.is_file() and is_supported_image(p)]
    return []


def make_output_path(src: Path, base_input: Path, output_dir: Path, inplace: bool, target_ext: str):
    if inplace:
        return src.with_suffix(target_ext)
    relative = src.relative_to(base_input) if base_input.is_dir() else src.name
    if isinstance(relative, Path):
        dest = output_dir.joinpath(relative).with_suffix(target_ext)
    else:
        dest = output_dir.joinpath(Path(relative).with_suffix(target_ext))
    dest.parent.mkdir(parents=True, exist_ok=True)
    return dest


def resize_image(img: Image.Image, max_size):
    if not max_size:
        return img
    width, height = max_size
    if img.width <= width and img.height <= height:
        return img
    img.thumbnail((width, height), Image.LANCZOS)
    return img


def convert_image(src: Path, dest: Path, fmt: str, quality: int, max_size):
    try:
        with Image.open(src) as img:
            if img.mode in ('P', 'PA'):
                img = img.convert('RGBA')
            elif img.mode not in ('RGB', 'RGBA', 'L'):
                img = img.convert('RGB')
            img = resize_image(img, max_size)
            save_kwargs = {'quality': quality}
            if fmt == 'webp':
                save_kwargs['method'] = 6
                save_kwargs['lossless'] = False
            elif fmt == 'avif':
                save_kwargs['codec'] = 'av1'
            img.save(dest, format=fmt.upper(), **save_kwargs)
        return True, None
    except UnidentifiedImageError:
        return False, 'Unsupported image or corrupted file'
    except Exception as exc:
        return False, str(exc)


def main():
    args = parse_args()
    max_size = parse_max_size(args.max_size)
    src_path = Path(args.input)
    output_dir = Path(args.output)
    if not args.inplace:
        output_dir.mkdir(parents=True, exist_ok=True)
    images = collect_images(src_path, args.recursive)
    if not images:
        print('Aucune image trouvée dans', src_path)
        return
    print(f'Found {len(images)} image(s) to convert to {args.format.upper()}')
    for src in images:
        dest = make_output_path(src, src_path, output_dir, args.inplace, '.' + args.format)
        if args.dry_run:
            print('[DRY RUN]', src, '->', dest)
            continue
        if not args.inplace and dest.exists() and dest.stat().st_mtime >= src.stat().st_mtime:
            print('Skip (already exists):', dest)
            continue
        ok, error = convert_image(src, dest, args.format, args.quality, max_size)
        if ok:
            print('Converted:', src, '->', dest)
        else:
            print('Failed:', src, '-', error)

if __name__ == '__main__':
    main()
