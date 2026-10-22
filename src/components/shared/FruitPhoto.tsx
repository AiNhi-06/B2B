import { useState } from 'react';
import { FruitImage } from './FruitImage';

// Temporary reference photos, CC0. Replace these URLs with actual supplier photos.
const photos = [
  { match: /avocado|bơ/i, file: '5/55/Avocados_Fruit.jpg', author: 'SarKaLay' },
  { match: /mango|xoài/i, file: 'd/d6/Mango_fruit_in_illorin.jpg', author: 'Eunice Ameh' },
  { match: /dragon|thanh long/i, file: '9/96/A_dragon_fruit.jpg', author: 'Helga Kattinger' },
];

export function FruitPhoto({ id, name, imageUrl }: { id: string; name: string; imageUrl?: string }) {
  const photo = photos.find((entry) => entry.match.test(`${id} ${name}`));
  const filename = photo?.file.split('/').pop();
  const source = imageUrl || (photo && `https://thumb.wikimedia.org/wikipedia/commons/thumb/${photo.file}/960px-${filename}`);
  const [failedSource, setFailedSource] = useState<string>();
  const showPhoto = source && failedSource !== source;

  return (
    <figure className="supplier-fruit-photo">
      <div className="supplier-photo-frame">
        {showPhoto ? (
          <img src={source} alt={`Ảnh minh họa ${name}`} width={480} height={280}
            loading="lazy" decoding="async" referrerPolicy="no-referrer"
            onError={() => setFailedSource(source)} />
        ) : (
          <div className="supplier-photo-fallback" role="img" aria-label={`Minh họa ${name}`}>
            <span aria-hidden="true"><FruitImage id={id} name={name} size={104} /></span>
          </div>
        )}
      </div>
      <figcaption>
        {!showPhoto ? 'Ảnh dự phòng' : imageUrl ? 'Ảnh lô hàng' : (
          <>Ảnh minh họa · <a href={`https://commons.wikimedia.org/wiki/File:${filename}`}
            target="_blank" rel="noreferrer">{photo?.author} / Wikimedia</a> · CC0</>
        )}
      </figcaption>
    </figure>
  );
}
