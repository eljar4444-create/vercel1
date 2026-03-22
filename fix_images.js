const fs = require('fs');
const file = './src/components/ProfileClient.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Import next/image
if (!content.includes('import Image from \'next/image\'')) {
    content = content.replace('import Link from \'next/link\';', 'import Image from \'next/image\';\nimport Link from \'next/link\';');
}

// 2. ServiceRow
content = content.replace(
    'className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-[#F0EBE3]"',
    'className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-[#F0EBE3]"'
).replace(
    /<img\s+src={thumb}\s+alt={service\.title}\s+className="h-full w-full object-cover"\s+onError={handleThumbError}\s+\/>/g,
    '<Image src={thumb} alt={service.title} fill className="object-cover" onError={handleThumbError} />'
);

// 3. Mobile Swipe
content = content.replace(
    /<img\s+src={src}\s+alt=\{`\$\{profile\.name\} — фото \$\{idx \+ 1\}`\}\s+fetchPriority=\{idx === 0 \? 'high' : 'auto'\}\s+loading=\{idx === 0 \? 'eager' : 'lazy'\}\s+className="absolute inset-0 h-full w-full object-cover object-top"\s+\/>/g,
    '<Image src={src} alt={`${profile.name} — фото ${idx + 1}`} priority={idx === 0} fill className="object-cover object-top" />'
);

// 4. Desktop Grid
content = content.replace(/<img src={imgs\[(\d+)\]} className="absolute inset-0 h-full w-full object-cover object-top transition duration-500 group-hover:scale-105 group-hover:opacity-90" alt="" \/>/g, 
    '<Image src={imgs[$1]} fill className="object-cover object-top transition duration-500 group-hover:scale-105 group-hover:opacity-90" alt="" sizes="(min-width: 768px) 50vw, 100vw" />'
);

// 5. Header Avatar
content = content.replace(
    /<img\s+src={headerAvatarSrc}\s+alt={profile\.name}\s+className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover shadow-sm shrink-0 object-top"\s+onError={\(\) => \{/g,
    '<Image src={headerAvatarSrc} alt={profile.name} width={128} height={128} className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover shadow-sm shrink-0 object-top" onError={() => {'
);

// 6. Lightbox
content = content.replace(
    /<img\s+src={coverImages\[selectedImageIndex\]}\s+alt="Увеличенное фото"\s+className="max-h-full max-w-full rounded-md object-contain"\s+\/>/g,
    '<Image src={coverImages[selectedImageIndex]} alt="Увеличенное фото" fill className="rounded-md object-contain" />'
);

// Wait, Lightbox parent must be relative for `fill` to work correctly.
// Lightbox parent: <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm"
// Wait! If the parent is flex center, it centers child. But `fill` is absolute positioning relative to closest relative/absolute/fixed parent (which is the fixed container). 
// That means `<Image fill>` will stretch to the entire screen. But `object-contain` will keep it centered and proportionally scaled! Which is EXACTLY what a lightbox needs!
// So just `fill className="object-contain"` is perfect.

fs.writeFileSync(file, content);
