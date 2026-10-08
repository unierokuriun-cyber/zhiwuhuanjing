import type { Mood } from '../../services/companion';
export function Avatar({ speciesId, mood, small = false }: {
    speciesId: string;
    mood: Mood;
    small?: boolean;
}) {
    const color = speciesId === 'bougainvillea' ? '#AE627C' : speciesId === 'tomato' ? '#D78958' : '#82A96A';
    return <svg className={`plant-avatar ${small ? 'small' : ''}`} viewBox="0 0 280 300" role="img" aria-label={`原创植物数字分身，${mood}`}>
    <ellipse cx="140" cy="275" rx="75" ry="12" fill="#315F45" opacity=".08"/>
    <g className="avatar-leaves">
    <path d="M140 204 Q145 120 143 72" fill="none" stroke="#315F45" strokeWidth="7" strokeLinecap="round"/>
    <path d="M143 147 C66 146 45 80 61 55 C116 53 146 90 143 147" fill="#315F45"/>
    <path d="M143 117 C211 111 234 60 222 38 C175 38 140 67 143 117" fill={color}/>
    <path d="M141 179 C186 182 223 145 218 121 C172 114 142 142 141 179" fill="#B5D6A4"/>
    <path d="M140 91 C103 78 99 43 110 29 C140 30 156 58 140 91" fill="#82A96A"/>
    <path d="M140 143 L73 73 M144 111 L209 54" stroke="#E7F0E5" strokeWidth="2" opacity=".5"/>
    </g>
    <path d="M86 189 H194 L181 258 Q140 282 99 258 Z" fill="#E8D9BE"/>
    <rect x="80" y="183" width="120" height="17" rx="7" fill="#F1E6D2"/>
    <g stroke="#315F45" strokeWidth="3" strokeLinecap="round" fill="none">
    {mood === '开心' ? <>
        <path d="M112 219 Q117 211 122 219"/>
        <path d="M157 219 Q162 211 167 219"/>
        </> : <>
        <path d="M118 215 v5"/>
        <path d="M162 215 v5"/>
        </>}
    <path d={mood === '疲惫' || mood === '需要关注' ? 'M132 241 Q140 234 148 241' : 'M132 233 Q140 243 148 233'}/>
    </g>
    <ellipse cx="108" cy="231" rx="8" ry="4" fill="#D78958" opacity=".3"/>
    <ellipse cx="172" cy="231" rx="8" ry="4" fill="#D78958" opacity=".3"/>
  </svg>;
}
