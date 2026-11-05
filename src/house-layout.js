import { rearItemPoint, rearViewPoint } from './rear-plan.js'

export const houseSections = [
  { number: 1, rooms: [
    { id: 'living-right', label: 'Khách phải', title: ['Phòng khách', 'bên phải'], fromPhotos: true, eye: [.23, 1.76, 1.46], aim: [1.68, 1.43, -.71], hall: [-.33, 1.78, 1.07], fov: 65, phoneFov: 77, phonePan: -.08 },
    { id: 'living-left', label: 'Khách trái', title: ['Phòng khách', 'bên trái'], fromPhotos: true,
      eye: [-2.28, 1.69, 1.50], aim: [-2.12, 1.44, -.86], hall: [-.34, 1.78, 1.06], fov: 61, phoneFov: 100, phonePan: -.06,
      photoViews: [
        { label: 'Góc ảnh 5', eye: [-2.28, 1.69, 1.50], aim: [-2.12, 1.44, -.86], zoom: 1 },
        { label: 'Góc ảnh 3', eye: [-.57, 1.72, .93], aim: [-3.10, 1.42, .05], zoom: .96 },
        { label: 'Góc ảnh 2', eye: [-3.78, 1.74, -.51], aim: [-.79, 1.631, -.296], zoom: .73 },
      ],
    },
  ] },
  { number: 2, rooms: [
    { id: 'kitchen-right', label: 'Bếp phải', title: ['Nhà bếp', 'bên phải'], fromPhotos: true,
      eye: [.78, 1.66, -2.18], aim: [2.06, 1.18, -4.68], hall: [.26, 1.74, -2.10], fov: 62, phoneFov: 78, phonePan: -.04,
      photoViews: [
        { label: 'Góc ảnh 1', eye: [1.42, .92, -4.42], aim: [1.48, 2.98, -4.22], zoom: 1.12 },
        { label: 'Góc ảnh 2', eye: [.16, 1.44, -3.48], aim: [2.58, 1.26, -4.14], zoom: 1.05 },
        { label: 'Góc ảnh 3', eye: [.78, 1.66, -2.18], aim: [2.06, 1.18, -4.68], zoom: 1.02 },
        { label: 'Góc ảnh 4', eye: [2.58, 1.50, -3.38], aim: [-.04, 1.44, -4.16], zoom: 1.05 },
        { label: 'Góc ảnh 5', eye: [1.72, 1.54, -4.85], aim: [1.22, 1.48, -1.65], zoom: 1.04 },
        { label: 'Góc ảnh 6', eye: [1.32, 1.44, -3.55], aim: [-.18, 1.48, -2.52], zoom: 1.04 },
        { label: 'Góc ảnh 7', eye: [.42, 1.46, -3.68], aim: [.32, 1.48, -1.00], zoom: 1.08 },
      ],
    },
    { id: 'bedroom-left', label: 'Ngủ trái', title: ['Phòng ngủ', 'bên trái'], eye: [-.68, 1.60, -3.95], aim: [-2.42, 1.20, -2.58], hall: [.24, 1.70, -2.68], fov: 62, phoneFov: 78, phonePan: 0 },
  ] },
  { number: 3, rooms: [
    { id: 'bathroom', label: 'Nhà vệ sinh', title: ['Khu sau &', 'nhà vệ sinh'], fromPhotos: true,
      eye: rearViewPoint([.38, 1.73, -6.83]), aim: rearItemPoint('wc-doors', [-2.34, 1.02, -6.80]), hall: [.08, 1.62, -5.85], fov: 70, phoneFov: 82, phonePan: -.04,
      photoViews: [
        { label: 'Góc ảnh 1', eye: [.27, 1.68, -3.70], aim: rearViewPoint([-.01, 1.35, -7.55]), zoom: .95 },
        { label: 'Góc ảnh 2', eye: rearViewPoint([.38, 1.73, -6.83]), aim: rearItemPoint('wc-doors', [-2.34, 1.02, -6.80]), zoom: 1 },
        { label: 'Góc ảnh 3', eye: rearViewPoint([-2.19, 1.53, -6.98]), aim: rearViewPoint([.50, 1.62, -7.06]), zoom: .91 },
        { label: 'Góc ảnh 4', eye: rearViewPoint([-.86, 1.48, -6.00]), aim: rearViewPoint([-.67, 1.39, -7.55]), zoom: 1.16 },
        { label: 'Góc ảnh 5', eye: rearViewPoint([-1.08, .98, -6.79]), aim: rearViewPoint([-1.08, 2.96, -7.12]), zoom: 1.14 },
      ],
    },
  ] },
]

export const rooms = houseSections.flatMap(({ number, rooms }) => rooms.map(room => ({ ...room, section: number })))
export const entryRoom = rooms[0].id
export const entryHall = [-.33, 1.78, 1.05]
export const entryDoor = [1.10, 1.79, 1.59]
