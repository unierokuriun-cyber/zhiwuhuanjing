import { Link } from "react-router-dom";
import { Leaf } from "lucide-react";
export function Placeholder() {
  return (
    <section className="empty-state">
      <Leaf size={40} />
      <h1>页面未找到</h1>
      <p>链接可能已更改，请从花园继续探索。</p>
      <Link className="button" to="/garden">
        返回花园
      </Link>
    </section>
  );
}
