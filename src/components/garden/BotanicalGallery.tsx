import { Link } from "react-router-dom";
import { ArrowUpRight, Leaf } from "lucide-react";
import { botanicalPhotos, photoForSpecies } from "../../services/plantPhotos";
import { PlantImage } from "../common/PlantImage";
export function BotanicalGallery() {
  return (
    <section
      className="botanical-gallery"
      aria-labelledby="botanical-gallery-title"
    >
      <div className="section-heading">
        <div>
          <span className="eyebrow">A LITTLE MORE GREEN</span>
          <h2 id="botanical-gallery-title">遇见下一株心动</h2>
          <p>观叶、赏花与香草，找到属于你的那一份绿意。</p>
        </div>
        <Leaf size={22} />
      </div>
      <div className="botanical-gallery-track" aria-label="八种植物图鉴">
        {botanicalPhotos.map((p) => (
          <Link
            className="botanical-gallery-card"
            key={p.id}
            to={`/plants/add?species=${p.id}`}
            aria-label={`认识${p.name}并添加档案`}
          >
            <PlantImage src={photoForSpecies(p.id)!} alt={`${p.name}图鉴`} />
            <div>
              <span className="botanical-category">{p.category}植物</span>
              <h3>
                {p.name}
                <ArrowUpRight size={16} />
              </h3>
              <p>{p.note}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
