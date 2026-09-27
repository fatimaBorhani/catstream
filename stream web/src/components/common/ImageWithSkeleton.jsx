import { useState } from 'react'

// تا خود عکس واقعی لود بشه، به‌جای یه باکس خالی یا پرش ناگهانی، یه اسکلتون در حال پالس
// نشون می‌دیم. img همیشه تو DOM هست (تا رویداد onLoad بگیره)، فقط با کلاس hidden مخفیه
// تا وقتی لود تموم بشه.
function ImageWithSkeleton({ src, alt, className }) {
  const [isLoaded, setIsLoaded] = useState(false)

  return (
    <>
      {!isLoaded && <div className={`animate-pulse bg-surface-2 ${className}`} />}
      <img
        src={src}
        alt={alt}
        onLoad={() => setIsLoaded(true)}
        className={`${className} ${isLoaded ? '' : 'hidden'}`}
      />
    </>
  )
}

export default ImageWithSkeleton
