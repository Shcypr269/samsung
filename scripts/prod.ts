import { db } from "@/lib/db";

const passages = {
  theSun: "The sun is a big star in the sky. It gives us light and heat. Plants need the sun to grow. We get Vitamin D from the sun.",
  myPet: "I have a pet dog. His name is Max. He is brown and white. He likes to play with a ball. Every day I take him for a walk.",
  rain: "Rain falls from the clouds. It waters the plants and fills the rivers. After the rain, we sometimes see a rainbow in the sky.",
  school: "I go to school every day. I learn math, science, and English. My teacher is very kind. I like to read books in class.",
  forest: "A forest is home to many animals. Deer, rabbits, and birds live there. Trees give them food and shelter. We must protect our forests.",
  waterCycle: "Water is always moving around our planet. It evaporates from lakes and rivers and rises into the air. There it forms clouds. When the clouds get heavy, water falls back as rain or snow. This is called the water cycle.",
  space: "Our solar system has eight planets. They all go around the sun. Earth is the third planet from the sun. It is the only planet we know that has life. People have travelled to the moon but not to other planets yet.",
  kindness: "Kindness means being nice to others. You can show kindness by sharing your things or helping a friend. Even a small smile can make someone feel better. Kind words cost nothing but mean a lot.",
  elephants: "Elephants are the largest land animals on Earth. They have big ears and long trunks. They use their trunks to eat, drink, and bathe. Elephants live in groups called herds. They are very smart and can remember things for many years.",
  invention: "The bicycle was invented over two hundred years ago. It did not have pedals at first. People used their feet to push it along. Later, pedals and chains were added. Today, bicycles are a fun way to travel and stay healthy.",
  ancientEgypt: "Ancient Egypt was a civilization that grew along the Nile River. The Egyptians built huge pyramids as tombs for their kings, called pharaohs. They also invented a form of writing called hieroglyphics. The Nile flooded every year, making the soil rich for farming.",
  photosynthesis: "Photosynthesis is how plants make their own food. Plants take in water from the ground and carbon dioxide from the air. Using energy from sunlight, they turn these into sugar and oxygen. This is why plants are so important for life on Earth.",
  robotics: "Robots are machines that can do tasks on their own or with some help from humans. Today robots are used in factories, hospitals, and even in space. Some robots can walk, talk, and learn. In the future, robots may help us in many more ways.",
  climate: "Climate change is one of the biggest challenges facing our world. The burning of coal, oil, and gas releases gases that trap heat in the atmosphere. This causes temperatures to rise, ice to melt, and weather patterns to change. Many countries are now working together to find solutions.",
  mars: "Mars is called the Red Planet because of its reddish surface. It has the tallest mountain in the solar system, Olympus Mons. Scientists have sent rovers to explore Mars and look for signs of ancient life. One day, humans may travel to Mars and build a colony there.",
};

const main = async () => {
  try {
    console.log("Seeding database");

    db.deleteAll();

    const [course] = db.insert("courses", [
      { id: undefined, title: "English Reading", imageSrc: "/us.svg" },
    ]);

    const [unit1, unit2] = db.insert("units", [
      { id: undefined, courseId: course.id, title: "Unit 1", description: "Grades 3–4: Simple passages", order: 1 },
      { id: undefined, courseId: course.id, title: "Unit 2", description: "Grades 5–8: Longer passages", order: 2 },
    ]);

    const unit1Lessons = db.insert("lessons", [
      { id: undefined, unitId: unit1.id, title: "Nature & Sky", order: 1 },
      { id: undefined, unitId: unit1.id, title: "Animals & Pets", order: 2 },
      { id: undefined, unitId: unit1.id, title: "Weather & Seasons", order: 3 },
      { id: undefined, unitId: unit1.id, title: "School Days", order: 4 },
      { id: undefined, unitId: unit1.id, title: "Our World", order: 5 },
    ]);

    const unit1Passages = [
      [passages.theSun, passages.myPet],
      [passages.myPet, passages.rain],
      [passages.rain, passages.school],
      [passages.school, passages.forest],
      [passages.forest, passages.theSun],
    ];

    for (let i = 0; i < unit1Lessons.length; i++) {
      db.insert("challenges", [
        { id: undefined, lessonId: unit1Lessons[i].id, type: "READ", question: unit1Passages[i][0], order: 1 },
        { id: undefined, lessonId: unit1Lessons[i].id, type: "READ", question: unit1Passages[i][1], order: 2 },
      ]);
    }

    const unit2Lessons = db.insert("lessons", [
      { id: undefined, unitId: unit2.id, title: "Science & Nature", order: 1 },
      { id: undefined, unitId: unit2.id, title: "Space & Exploration", order: 2 },
      { id: undefined, unitId: unit2.id, title: "Values & Kindness", order: 3 },
      { id: undefined, unitId: unit2.id, title: "History & Civilisation", order: 4 },
      { id: undefined, unitId: unit2.id, title: "Technology & Future", order: 5 },
    ]);

    const unit2Passages = [
      [passages.waterCycle, passages.photosynthesis],
      [passages.space, passages.mars],
      [passages.kindness, passages.elephants],
      [passages.ancientEgypt, passages.invention],
      [passages.robotics, passages.climate],
    ];

    for (let i = 0; i < unit2Lessons.length; i++) {
      db.insert("challenges", [
        { id: undefined, lessonId: unit2Lessons[i].id, type: "READ", question: unit2Passages[i][0], order: 1 },
        { id: undefined, lessonId: unit2Lessons[i].id, type: "READ", question: unit2Passages[i][1], order: 2 },
      ]);
    }

    console.log("Database seeded successfully");
  } catch (error) {
    console.error(error);
    throw new Error("Failed to seed database");
  }
};

void main();
