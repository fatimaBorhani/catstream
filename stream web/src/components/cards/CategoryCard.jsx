import { Link } from 'react-router-dom'
import ImageWithSkeleton from '../common/ImageWithSkeleton'

function CategoryCard({ id, boxArtImage, name, viewerCount }) {
  return (
    <Link
      to={`/category/${id}`}
      className="group block transition-transform duration-150 active:scale-[0.98]"
    >
      <div className="aspect-[3/4] overflow-hidden rounded-lg bg-surface-2">
        <ImageWithSkeleton
          src={boxArtImage}
          alt={name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <p className="mt-2 truncate font-brand text-sm font-semibold text-text transition-colors group-hover:text-accent">
        {name}
      </p>
      <p className="text-xs text-text-dim">{viewerCount.toLocaleString()} viewers</p>
    </Link>
  )
}

export default CategoryCard
