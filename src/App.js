import axios from 'axios';
import { addMonths } from 'date-fns';
import React, { useState, useEffect, useRef } from 'react';
import { Input, Button } from '@material-tailwind/react';

import './App.css';

const App = () => {
  const [search, setSearch] = useState('');
  const [selectedSpecialist, setSelectedSpecialist] = useState([]);
  const [specialists, setSpecialists] = useState([]);
  const [filteredSpecialists, setFilteredSpecialists] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const lithuanianToEnglishMap = {
    Ą: 'A',
    Č: 'C',
    Ę: 'E',
    Ė: 'E',
    Į: 'I',
    Š: 'S',
    Ų: 'U',
    Ū: 'U',
    Ž: 'Z',
  };
  const searchRef = useRef(null);
  const filteredResults = useRef(null);

  useEffect(() => {
    setFilteredSpecialists(
      specialists?.filter(
        (specialist) =>
          search.length > 0 &&
          specialist?.fullName
            ?.toUpperCase()
            ?.replace(
              /[ĄČĘĖĮŠŲŪŽ]/g,
              (match) => lithuanianToEnglishMap[match] || match
            )
            ?.includes(
              search
                ?.toUpperCase()
                ?.replace(
                  /[ĄČĘĖĮŠŲŪŽ]/g,
                  (match) => lithuanianToEnglishMap[match] || match
                )
            )
      )
    );

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, specialists]);

  // useEffect(() => {
  //   console.log(filteredSpecialists);
  // }, [filteredSpecialists]);

  useEffect(() => {
    axios
      .get('https://ipr.esveikata.lt/api/searchesNew/specialists')
      .then(({ data }) => setSpecialists(data.data));
  }, []);

  const getTimeBounds = () => {
    const currentLithuaniaDate = new Date(
      new Date(Date.now()).toLocaleString('en-US', {
        timeZone: 'Europe/Vilnius',
      })
    );
    const currentLithuaniaTime = currentLithuaniaDate.getTime();
    const futureLithuaniaDate = addMonths(currentLithuaniaDate, 3);
    const futureLithuaniaTime = futureLithuaniaDate.getTime();

    console.log();
    return { leftBound: currentLithuaniaTime, rightBound: futureLithuaniaTime };
  };

  const handleClick = (event, id) => {
    // searchRef.value = event.target.innerText;
    setSearch(event.target.innerText);
    setSelectedSpecialist(
      filteredSpecialists.filter((specialist) => specialist.id === id)
    );

    // setSelectedSpecialist(filteredSpecialists[key]);
    // console.log(searchRef.innerText, event.target.innerText);
  };

  const handleSearch = (event) => {
    // axios.post();

    console.log('selectedSpecialist: ', selectedSpecialist.pop());

    const { leftBound, rightBound } = getTimeBounds();
    console.log(leftBound, rightBound);
    axios.get('https://ipr.esveikata.lt/api/searches/appointments/times', {
      params: {
        municipalityId: 6,
        specialistId: selectedSpecialist.id,
        healthcareServiceId: 360,
        organizationId: 1000097404,
        leftBound: leftBound,
        rightBound: rightBound,
        page: 0,
        size: 50,
      },
    });
  };

  return (
    <div className=''>
      <header className='bg-yellow-800 text-white font-bold h-12 flex items-center p-4 drop-shadow-md'>
        <div className=''>Registracija pas gydytoją</div>
      </header>
      <div className='m-40'>
        <div className='w-full m-auto flex justify-center'>
          <div className='flex flex-col w-96 gap-6'>
            <div className='relative flex w-full max-w-[24rem]'>
              <Input
                inputRef={searchRef}
                size='md'
                label='Vardas'
                color='indigo'
                onChange={({ target }) => setSearch(target.value)}
              />
              <Button
                size='sm'
                color={search ? 'indigo' : 'blue-gray'}
                disabled={!search}
                className='!absolute right-1 top-1 rounded'
                onClick={(event) => handleSearch(event)}
              >
                Ieškoti
              </Button>
            </div>
            <div ref={filteredResults} className='flex flex-col gap-1'>
              {filteredSpecialists.map((specialist, key) => (
                <button
                  id={specialist.id}
                  key={`specialist-${specialist.id}-${key}`}
                  type='button'
                  className='text-left border-2 rounded-md min-h-[52px] p-2'
                  onClick={(event) => handleClick(event, specialist.id)}
                >
                  {specialist.fullName}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
